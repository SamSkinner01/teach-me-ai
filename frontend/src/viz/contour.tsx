import { useEffect, useRef } from "react";
import { cssVar, useTheme } from "../state/theme";

function parseColor(c: string): [number, number, number] {
  const m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const r = c.match(/\d+(\.\d+)?/g);
  return r ? [Number(r[0]), Number(r[1]), Number(r[2])] : [128, 128, 128];
}

/**
 * A filled contour plot of f(x, y) drawn on a canvas: darker bands are higher.
 * Position an <svg> with the same aspect ratio on top for markers and paths.
 */
export function ContourCanvas({
  f,
  x0,
  x1,
  y0,
  y1,
  res = 200,
  levels = 14,
  compress = true,
}: {
  f: (x: number, y: number) => number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  res?: number;
  levels?: number;
  compress?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const low = parseColor(cssVar("--surface"));
    const high = parseColor(cssVar("--accent"));
    const vals = new Float64Array(res * res);
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const v = f(x0 + ((x1 - x0) * (i + 0.5)) / res, y1 - ((y1 - y0) * (j + 0.5)) / res);
        vals[j * res + i] = v;
        if (Number.isFinite(v)) {
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    }
    const norm = (v: number) => {
      const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo || 1)));
      return compress ? Math.sqrt(t) : t;
    };
    const band = (k: number) => Math.floor(norm(vals[k]) * levels);
    const img = ctx.createImageData(res, res);
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const k = j * res + i;
        const b = band(k);
        const edge = (i + 1 < res && band(k + 1) !== b) || (j + 1 < res && band(k + res) !== b);
        const mix = 0.05 + 0.6 * (b / levels);
        for (let c = 0; c < 3; c++) {
          const v = low[c] * (1 - mix) + high[c] * mix;
          img.data[k * 4 + c] = edge ? v * 0.82 : v;
        }
        img.data[k * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [f, x0, x1, y0, y1, res, levels, compress, theme]);

  return <canvas ref={ref} width={res} height={res} className="gf-canvas" aria-hidden="true" />;
}
