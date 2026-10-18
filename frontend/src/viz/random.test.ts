import { describe, expect, it } from "vitest";
import { Rng, softmax, xorshift32 } from "./random";

describe("xorshift32", () => {
  it("matches the exercise's reference values", () => {
    expect(xorshift32(1)).toBe(270369);
    expect(xorshift32(2463534242)).toBe(723471715);
    expect(xorshift32(4294967295)).toBe(253983);
  });

  it("produces the same uniforms and normals as the Python reference", () => {
    const rng = new Rng(2463534242);
    expect(rng.uniform()).toBeCloseTo(0.16844638506881893, 12);
    const normals = new Rng(2463534242);
    // random_normals(2463534242, 4)
    const expected = [-1.6455093556075222, -0.924431987362357, -1.185461226979586, 0.24522960848372194];
    for (const e of expected) expect(normals.normal()).toBeCloseTo(e, 10);
  });
});

describe("softmax", () => {
  it("is shift-invariant and sums to 1", () => {
    const a = softmax([1, 2, 3]);
    const b = softmax([1001, 1002, 1003]);
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 12));
    expect(a.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12);
  });
});
