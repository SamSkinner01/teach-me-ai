"""Train the small CNN used by the draw-a-digit demo (frontend/public/models/demo-cnn.json).

This is tooling, not course material: learners build their own CNN from scratch
in the capstone. It uses NumPy for speed.

    uv run --with numpy python scripts/train_demo_model.py [--epochs 6]

Architecture (input 1×28×28):
    conv 8@3×3 → ReLU → maxpool 2   → 8×13×13
    conv 16@3×3 → ReLU → maxpool 2  → 16×5×5
    flatten 400 → dense 10 → softmax
"""

import argparse
import base64
import gzip
import json
import struct
import time
import urllib.request
from datetime import date
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "mnist"
OUT = ROOT / "frontend" / "public" / "models" / "demo-cnn.json"
MIRROR = "https://ossci-datasets.s3.amazonaws.com/mnist/"
FILES = {
    "train_x": "train-images-idx3-ubyte.gz",
    "train_y": "train-labels-idx1-ubyte.gz",
    "test_x": "t10k-images-idx3-ubyte.gz",
    "test_y": "t10k-labels-idx1-ubyte.gz",
}
MEAN, STD = 0.1307, 0.3081


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------


def download():
    DATA.mkdir(parents=True, exist_ok=True)
    for name in FILES.values():
        path = DATA / name
        if not path.exists():
            print(f"downloading {name}")
            urllib.request.urlretrieve(MIRROR + name, path)


def read_idx(path: Path) -> np.ndarray:
    with gzip.open(path, "rb") as f:
        data = f.read()
    zero, dtype, ndim = struct.unpack(">HBB", data[:4])
    assert zero == 0 and dtype == 0x08, "expected unsigned-byte IDX data"
    shape = struct.unpack(">" + "I" * ndim, data[4 : 4 + 4 * ndim])
    return np.frombuffer(data, dtype=np.uint8, offset=4 + 4 * ndim).reshape(shape)


def load():
    download()
    arrays = {k: read_idx(DATA / v) for k, v in FILES.items()}
    norm = lambda x: ((x.astype(np.float32) / 255.0 - MEAN) / STD)[:, None, :, :]
    return norm(arrays["train_x"]), arrays["train_y"].astype(np.int64), norm(arrays["test_x"]), arrays["test_y"].astype(np.int64)


def shift_batch(x: np.ndarray, rng: np.random.Generator, max_shift: int = 2) -> np.ndarray:
    """Random translations so the model copes with off-centre handwriting."""
    n = x.shape[0]
    background = (0 - MEAN) / STD
    padded = np.full((n, 1, 28 + 2 * max_shift, 28 + 2 * max_shift), background, dtype=np.float32)
    padded[:, :, max_shift:-max_shift, max_shift:-max_shift] = x
    out = np.empty_like(x)
    dx = rng.integers(0, 2 * max_shift + 1, n)
    dy = rng.integers(0, 2 * max_shift + 1, n)
    for i in range(n):
        out[i] = padded[i, :, dy[i] : dy[i] + 28, dx[i] : dx[i] + 28]
    return out


# ---------------------------------------------------------------------------
# Layers (forward returns a cache for backward)
# ---------------------------------------------------------------------------


def conv_forward(x, w, b):
    n, c, h, wd = x.shape
    o, _, k, _ = w.shape
    oh, ow = h - k + 1, wd - k + 1
    s = x.strides
    cols = np.lib.stride_tricks.as_strided(x, (n, oh, ow, c, k, k), (s[0], s[2], s[3], s[1], s[2], s[3]))
    cols = cols.reshape(n * oh * ow, c * k * k)
    out = cols @ w.reshape(o, -1).T + b
    return out.reshape(n, oh, ow, o).transpose(0, 3, 1, 2), (x.shape, cols, w)


def conv_backward(dout, cache, need_dx=True):
    (n, c, h, wd), cols, w = cache
    o, _, k, _ = w.shape
    oh, ow = h - k + 1, wd - k + 1
    dflat = dout.transpose(0, 2, 3, 1).reshape(-1, o)
    dw = (dflat.T @ cols).reshape(w.shape)
    db = dflat.sum(0)
    if not need_dx:
        return None, dw, db
    dcols = (dflat @ w.reshape(o, -1)).reshape(n, oh, ow, c, k, k)
    dx = np.zeros((n, c, h, wd), dtype=dout.dtype)
    for u in range(k):
        for v in range(k):
            dx[:, :, u : u + oh, v : v + ow] += dcols[:, :, :, :, u, v].transpose(0, 3, 1, 2)
    return dx, dw, db


def pool_forward(x):
    n, c, h, w = x.shape
    h2, w2 = h // 2 * 2, w // 2 * 2
    xr = x[:, :, :h2, :w2].reshape(n, c, h2 // 2, 2, w2 // 2, 2)
    out = xr.max(axis=(3, 5))
    mask = xr == out[:, :, :, None, :, None]
    return out, (x.shape, mask)


def pool_backward(dout, cache):
    (n, c, h, w), mask = cache
    h2, w2 = h // 2 * 2, w // 2 * 2
    dx = np.zeros((n, c, h, w), dtype=dout.dtype)
    dx[:, :, :h2, :w2] = (mask * dout[:, :, :, None, :, None]).reshape(n, c, h2, w2)
    return dx


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------


def init(rng):
    he = lambda shape, fan_in: (rng.standard_normal(shape) * np.sqrt(2.0 / fan_in)).astype(np.float32)
    return {
        "conv1.w": he((8, 1, 3, 3), 9),
        "conv1.b": np.zeros(8, np.float32),
        "conv2.w": he((16, 8, 3, 3), 72),
        "conv2.b": np.zeros(16, np.float32),
        "fc.w": (rng.standard_normal((10, 400)) * np.sqrt(1.0 / 400)).astype(np.float32),
        "fc.b": np.zeros(10, np.float32),
    }


def forward(p, x):
    a1, c1 = conv_forward(x, p["conv1.w"], p["conv1.b"])
    r1 = np.maximum(a1, 0)
    m1, pc1 = pool_forward(r1)
    a2, c2 = conv_forward(m1, p["conv2.w"], p["conv2.b"])
    r2 = np.maximum(a2, 0)
    m2, pc2 = pool_forward(r2)
    flat = m2.reshape(len(x), -1)
    logits = flat @ p["fc.w"].T + p["fc.b"]
    return logits, (c1, a1, pc1, c2, a2, pc2, flat, m2.shape)


def loss_and_grads(p, x, y):
    logits, (c1, a1, pc1, c2, a2, pc2, flat, m2_shape) = forward(p, x)
    shifted = logits - logits.max(1, keepdims=True)
    probs = np.exp(shifted)
    probs /= probs.sum(1, keepdims=True)
    n = len(x)
    loss = -np.log(probs[np.arange(n), y] + 1e-12).mean()

    g = {}
    dlogits = probs
    dlogits[np.arange(n), y] -= 1
    dlogits /= n
    g["fc.w"] = dlogits.T @ flat
    g["fc.b"] = dlogits.sum(0)
    dflat = dlogits @ p["fc.w"]
    dm2 = dflat.reshape(m2_shape)
    dr2 = pool_backward(dm2, pc2)
    da2 = dr2 * (a2 > 0)
    dm1, g["conv2.w"], g["conv2.b"] = conv_backward(da2, c2)
    dr1 = pool_backward(dm1, pc1)
    da1 = dr1 * (a1 > 0)
    _, g["conv1.w"], g["conv1.b"] = conv_backward(da1, c1, need_dx=False)
    return loss, g


def accuracy(p, x, y, batch=1000):
    correct = 0
    for i in range(0, len(x), batch):
        logits, _ = forward(p, x[i : i + batch])
        correct += int((logits.argmax(1) == y[i : i + batch]).sum())
    return correct / len(x)


def encode(a: np.ndarray) -> dict:
    return {"shape": list(a.shape), "data": base64.b64encode(a.astype("<f4").tobytes()).decode("ascii")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=6)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    train_x, train_y, test_x, test_y = load()
    print(f"train {train_x.shape}, test {test_x.shape}")

    p = init(rng)
    m = {k: np.zeros_like(v) for k, v in p.items()}
    v = {k: np.zeros_like(v) for k, v in p.items()}
    b1, b2, eps = 0.9, 0.999, 1e-8
    t = 0
    for epoch in range(args.epochs):
        start = time.time()
        order = rng.permutation(len(train_x))
        lr = args.lr * (0.6**epoch)
        total = 0.0
        for i in range(0, len(order), args.batch):
            idx = order[i : i + args.batch]
            xb = shift_batch(train_x[idx], rng)
            loss, g = loss_and_grads(p, xb, train_y[idx])
            total += loss * len(idx)
            t += 1
            for k in p:
                m[k] = b1 * m[k] + (1 - b1) * g[k]
                v[k] = b2 * v[k] + (1 - b2) * g[k] ** 2
                mh = m[k] / (1 - b1**t)
                vh = v[k] / (1 - b2**t)
                p[k] -= (lr * mh / (np.sqrt(vh) + eps)).astype(np.float32)
        acc = accuracy(p, test_x, test_y)
        print(f"epoch {epoch + 1}: loss {total / len(order):.4f}  test accuracy {acc:.4f}  ({time.time() - start:.0f}s)")

    model = {
        "format": "tmai-cnn-v1",
        "trained": date.today().isoformat(),
        "test_accuracy": round(acc, 4),
        "input": {"size": 28, "mean": MEAN, "std": STD},
        "layers": [
            {"type": "conv", "w": encode(p["conv1.w"]), "b": encode(p["conv1.b"])},
            {"type": "relu"},
            {"type": "maxpool"},
            {"type": "conv", "w": encode(p["conv2.w"]), "b": encode(p["conv2.b"])},
            {"type": "relu"},
            {"type": "maxpool"},
            {"type": "flatten"},
            {"type": "dense", "w": encode(p["fc.w"]), "b": encode(p["fc.b"])},
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(model))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KiB)")

    # Reference outputs for the JavaScript inference test.
    logits, _ = forward(p, test_x[:5])
    ref = {"inputs": encode(test_x[:5]), "labels": test_y[:5].tolist(), "logits": logits.tolist()}
    (ROOT / "frontend" / "src" / "viz" / "cnn.reference.json").write_text(json.dumps(ref))


if __name__ == "__main__":
    main()
