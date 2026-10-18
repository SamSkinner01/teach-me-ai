// The same generator learners build in Module 3 (xorshift32 + Box–Muller),
// so the figures produce exactly the numbers their own code would.

export function xorshift32(state: number): number {
  let x = state >>> 0;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 2463534242;
  }

  /** Uniform in (0, 1). */
  uniform(): number {
    this.state = xorshift32(this.state);
    return this.state / 4294967296;
  }

  /** Standard normal via Box–Muller (one value per call; the pair's second half is cached). */
  private spare: number | null = null;
  normal(): number {
    if (this.spare !== null) {
      const s = this.spare;
      this.spare = null;
      return s;
    }
    const r = Math.sqrt(-2 * Math.log(this.uniform()));
    const theta = 2 * Math.PI * this.uniform();
    this.spare = r * Math.sin(theta);
    return r * Math.cos(theta);
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.uniform() * n);
  }

  /** Index drawn according to probabilities `p` (which sum to 1). */
  categorical(p: number[]): number {
    let u = this.uniform();
    for (let i = 0; i < p.length; i++) {
      u -= p[i];
      if (u < 0) return i;
    }
    return p.length - 1;
  }
}

export function softmax(z: number[], temperature = 1): number[] {
  const scaled = z.map((v) => v / temperature);
  const m = Math.max(...scaled);
  const e = scaled.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

/** Bits of a 32-bit unsigned integer, most significant first. */
export function bits32(x: number): number[] {
  return Array.from({ length: 32 }, (_, i) => (x >>> (31 - i)) & 1);
}
