import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decode, loadModel, mnistify, predict, type ModelFile } from "./cnn";

const model = loadModel(JSON.parse(readFileSync(new URL("../../public/models/demo-cnn.json", import.meta.url), "utf8")) as ModelFile);
const ref = JSON.parse(readFileSync(new URL("./cnn.reference.json", import.meta.url), "utf8"));

describe("demo CNN inference", () => {
  it("matches the NumPy training code's logits", () => {
    const inputs = decode(ref.inputs);
    const [n, , h, w] = inputs.shape;
    for (let i = 0; i < n; i++) {
      const data = inputs.data.slice(i * h * w, (i + 1) * h * w);
      const { logits } = predict(model, { shape: [1, h, w], data });
      ref.logits[i].forEach((expected: number, k: number) => expect(logits[k]).toBeCloseTo(expected, 3));
    }
  });

  it("predicts the labels of the reference digits", () => {
    const inputs = decode(ref.inputs);
    const [n, , h, w] = inputs.shape;
    for (let i = 0; i < n; i++) {
      const { probs } = predict(model, { shape: [1, h, w], data: inputs.data.slice(i * h * w, (i + 1) * h * w) });
      expect(probs.indexOf(Math.max(...probs))).toBe(ref.labels[i]);
      expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    }
  });
});

describe("mnistify", () => {
  it("returns null for an empty drawing", () => {
    expect(mnistify(new Float32Array(100 * 100), 100, 100)).toBeNull();
  });

  it("scales and centres a stroke", () => {
    const W = 100;
    const ink = new Float32Array(W * W);
    // a vertical bar in the top-left corner
    for (let y = 5; y < 45; y++) for (let x = 5; x < 15; x++) ink[y * W + x] = 1;
    const out = mnistify(ink, W, W)!;
    let mass = 0;
    let cx = 0;
    let cy = 0;
    let rows = 0;
    for (let y = 0; y < 28; y++) {
      let rowInk = false;
      for (let x = 0; x < 28; x++) {
        const v = out[y * 28 + x];
        mass += v;
        cx += v * x;
        cy += v * y;
        if (v > 0.5) rowInk = true;
      }
      if (rowInk) rows++;
    }
    expect(rows).toBe(20); // longest side scaled to 20 px
    expect(cx / mass).toBeGreaterThan(13);
    expect(cx / mass).toBeLessThan(15);
    expect(cy / mass).toBeGreaterThan(13);
    expect(cy / mass).toBeLessThan(15);
  });
});
