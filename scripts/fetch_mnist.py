"""Download MNIST and write the uncompressed IDX files the capstone reads.

    python3 scripts/fetch_mnist.py

Writes data/mnist/raw/{train,t10k}-{images-idx3,labels-idx1}-ubyte (about 55 MB).
The runner image build copies them to /data/mnist inside the sandbox.
"""

import gzip
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GZ_DIR = ROOT / "data" / "mnist"
RAW_DIR = GZ_DIR / "raw"
MIRROR = "https://ossci-datasets.s3.amazonaws.com/mnist/"
NAMES = ["train-images-idx3-ubyte", "train-labels-idx1-ubyte", "t10k-images-idx3-ubyte", "t10k-labels-idx1-ubyte"]
SIZES = {
    "train-images-idx3-ubyte": 47040016,
    "train-labels-idx1-ubyte": 60008,
    "t10k-images-idx3-ubyte": 7840016,
    "t10k-labels-idx1-ubyte": 10008,
}


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        raw = RAW_DIR / name
        if raw.exists() and raw.stat().st_size == SIZES[name]:
            continue
        gz = GZ_DIR / f"{name}.gz"
        if not gz.exists():
            print(f"downloading {gz.name}")
            urllib.request.urlretrieve(MIRROR + gz.name, gz)
        with gzip.open(gz, "rb") as src, open(raw, "wb") as dst:
            shutil.copyfileobj(src, dst)
        if raw.stat().st_size != SIZES[name]:
            raise SystemExit(f"{name} has the wrong size; delete {gz} and retry")
        print(f"wrote {raw}")
    print(f"MNIST ready in {RAW_DIR}")


if __name__ == "__main__":
    main()
