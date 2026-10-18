// Inference for the demo CNN (format "tmai-cnn-v1", see scripts/train_demo_model.py).
// Plain loops on Float32Arrays: the same operations learners implement in the capstone.

export interface Tensor {
  shape: number[];
  data: Float32Array;
}

interface EncodedTensor {
  shape: number[];
  data: string; // base64 little-endian float32
}

type LayerSpec =
  | { type: "conv"; w: EncodedTensor; b: EncodedTensor }
  | { type: "dense"; w: EncodedTensor; b: EncodedTensor }
  | { type: "relu" | "maxpool" | "flatten" };

export interface ModelFile {
  format: string;
  test_accuracy: number;
  input: { size: number; mean: number; std: number };
  layers: LayerSpec[];
}

type Layer =
  | { type: "conv"; w: Tensor; b: Tensor }
  | { type: "dense"; w: Tensor; b: Tensor }
  | { type: "relu" | "maxpool" | "flatten" };

export interface Model {
  accuracy: number;
  mean: number;
  std: number;
  layers: Layer[];
}

export function decode(t: EncodedTensor): Tensor {
  const bin = atob(t.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const data = new Float32Array(bytes.length / 4);
  for (let i = 0; i < data.length; i++) data[i] = view.getFloat32(i * 4, true);
  return { shape: t.shape, data };
}

export function loadModel(file: ModelFile): Model {
  if (file.format !== "tmai-cnn-v1") throw new Error(`unknown model format ${file.format}`);
  return {
    accuracy: file.test_accuracy,
    mean: file.input.mean,
    std: file.input.std,
    layers: file.layers.map((l) =>
      l.type === "conv" || l.type === "dense" ? { type: l.type, w: decode(l.w), b: decode(l.b) } : { type: l.type },
    ),
  };
}

/** Valid (no padding) cross-correlation, stride 1. x: [C, H, W], w: [O, C, K, K]. */
export function conv2d(x: Tensor, w: Tensor, b: Tensor): Tensor {
  const [C, H, W] = x.shape;
  const [O, , K] = w.shape;
  const OH = H - K + 1;
  const OW = W - K + 1;
  const out = new Float32Array(O * OH * OW);
  for (let o = 0; o < O; o++) {
    for (let i = 0; i < OH; i++) {
      for (let j = 0; j < OW; j++) {
        let s = b.data[o];
        for (let c = 0; c < C; c++) {
          for (let u = 0; u < K; u++) {
            const xRow = (c * H + i + u) * W + j;
            const wRow = ((o * C + c) * K + u) * K;
            for (let v = 0; v < K; v++) s += x.data[xRow + v] * w.data[wRow + v];
          }
        }
        out[(o * OH + i) * OW + j] = s;
      }
    }
  }
  return { shape: [O, OH, OW], data: out };
}

export function relu(x: Tensor): Tensor {
  return { shape: x.shape, data: x.data.map((v) => (v > 0 ? v : 0)) };
}

/** 2×2 max pooling, stride 2, dropping an odd last row/column. */
export function maxpool2(x: Tensor): Tensor {
  const [C, H, W] = x.shape;
  const OH = Math.floor(H / 2);
  const OW = Math.floor(W / 2);
  const out = new Float32Array(C * OH * OW);
  for (let c = 0; c < C; c++) {
    for (let i = 0; i < OH; i++) {
      for (let j = 0; j < OW; j++) {
        const base = (c * H + 2 * i) * W + 2 * j;
        out[(c * OH + i) * OW + j] = Math.max(x.data[base], x.data[base + 1], x.data[base + W], x.data[base + W + 1]);
      }
    }
  }
  return { shape: [C, OH, OW], data: out };
}

export function dense(x: Tensor, w: Tensor, b: Tensor): Tensor {
  const [O, I] = w.shape;
  const out = new Float32Array(O);
  for (let o = 0; o < O; o++) {
    let s = b.data[o];
    for (let i = 0; i < I; i++) s += w.data[o * I + i] * x.data[i];
    out[o] = s;
  }
  return { shape: [O], data: out };
}

export function softmax(logits: Float32Array): number[] {
  const m = Math.max(...logits);
  const e = Array.from(logits, (v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export interface Prediction {
  logits: Float32Array;
  probs: number[];
  /** Output of every layer, for visualizing feature maps. */
  activations: Tensor[];
}

/** Run the model on a normalized 1×28×28 input. */
export function predict(model: Model, input: Tensor): Prediction {
  let x = input;
  const activations: Tensor[] = [];
  for (const layer of model.layers) {
    if (layer.type === "conv") x = conv2d(x, layer.w, layer.b);
    else if (layer.type === "dense") x = dense(x, layer.w, layer.b);
    else if (layer.type === "relu") x = relu(x);
    else if (layer.type === "maxpool") x = maxpool2(x);
    else x = { shape: [x.data.length], data: x.data };
    activations.push(x);
  }
  return { logits: x.data, probs: softmax(x.data), activations };
}

/**
 * Turn a drawing (grayscale, 0 = background, 1 = ink) into an MNIST-style input:
 * crop to the ink, scale the longer side to 20 px, and centre the centre of mass
 * in a 28×28 frame. That's how the original dataset was prepared.
 */
export function mnistify(ink: Float32Array, width: number, height: number): Float32Array | null {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (ink[y * width + x] > 0.05) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const scale = 20 / Math.max(bw, bh);
  const sw = Math.max(1, Math.round(bw * scale));
  const sh = Math.max(1, Math.round(bh * scale));

  // Area-average downsampling of the bounding box into sw×sh.
  const small = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const sx0 = x0 + (x * bw) / sw;
      const sx1 = x0 + ((x + 1) * bw) / sw;
      const sy0 = y0 + (y * bh) / sh;
      const sy1 = y0 + ((y + 1) * bh) / sh;
      let sum = 0;
      let n = 0;
      for (let yy = Math.floor(sy0); yy < Math.ceil(sy1); yy++) {
        for (let xx = Math.floor(sx0); xx < Math.ceil(sx1); xx++) {
          sum += ink[yy * width + xx];
          n++;
        }
      }
      small[y * sw + x] = n ? sum / n : 0;
    }
  }

  // Centre of mass of the scaled digit.
  let mass = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const v = small[y * sw + x];
      mass += v;
      cx += v * x;
      cy += v * y;
    }
  }
  cx = mass ? cx / mass : sw / 2;
  cy = mass ? cy / mass : sh / 2;
  const ox = Math.round(14 - cx);
  const oy = Math.round(14 - cy);

  const out = new Float32Array(28 * 28);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const tx = x + ox;
      const ty = y + oy;
      if (tx >= 0 && tx < 28 && ty >= 0 && ty < 28) out[ty * 28 + tx] = Math.min(1, small[y * sw + x]);
    }
  }
  return out;
}
