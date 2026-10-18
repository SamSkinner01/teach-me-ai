import type { ProgressPoint } from "../api";
import { linear } from "./common";

// Live learning curves for a capstone training run.

const W = 380;
const H = 200;
const L = 42;
const R = 14;
const T = 14;
const B = 30;

type XY = [number, number];

/** Exponential moving average with a fixed decay per mini-batch (and Adam-style bias
 * correction), so the smoothing looks the same however often progress was reported. */
export function smooth(points: ProgressPoint[], col: 3 | 4, decay = 0.96): XY[] {
  const out: XY[] = [];
  let s = 0;
  let seen = 0;
  for (const p of points) {
    const y = p[col];
    if (y === null) continue;
    const keep = decay ** p[5];
    s = s * keep + y * (1 - keep);
    seen += p[5];
    out.push([p[0] + p[1] / p[2], s / (1 - decay ** seen)]);
  }
  return out;
}

function raw(points: ProgressPoint[], col: 3 | 4): XY[] {
  const out: XY[] = [];
  for (const p of points) {
    const y = p[col];
    if (y !== null) out.push([p[0] + p[1] / p[2], y]);
  }
  return out;
}

/** At most ``n`` points, each the mean of a run of neighbours (keeps the path light). */
function thin(xy: XY[], n: number): XY[] {
  if (xy.length <= n) return xy;
  const out: XY[] = [];
  for (let g = 0; g < n; g++) {
    const a = Math.floor((g * xy.length) / n);
    const b = Math.floor(((g + 1) * xy.length) / n);
    let y = 0;
    for (let i = a; i < b; i++) y += xy[i][1];
    out.push([xy[b - 1][0], y / (b - a)]);
  }
  return out;
}

function Chart({
  title,
  points,
  col,
  epochs,
  yMax,
  ticks,
  format,
  threshold,
  final,
}: {
  title: string;
  points: ProgressPoint[];
  col: 3 | 4;
  epochs: number;
  yMax: number;
  ticks: number[];
  format: (v: number) => string;
  threshold?: number;
  final?: number | null;
}) {
  const sx = linear(0, epochs, L, W - R);
  const sy = linear(0, yMax, H - B, T);
  const path = (xy: XY[]) =>
    xy.length ? "M" + xy.map(([x, y]) => `${sx(x).toFixed(1)},${sy(Math.min(y, yMax)).toFixed(1)}`).join("L") : "";
  const rawPath = path(thin(raw(points, col), 500));
  const smoothXY = thin(smooth(points, col), 300);
  const last = smoothXY[smoothXY.length - 1];
  const xTicks = epochs <= 6 ? Array.from({ length: epochs + 1 }, (_, i) => i) : [0, epochs / 2, epochs];

  return (
    <figure className="train-chart">
      <figcaption>
        <span>{title}</span>
        {last && <strong className="mono">{format(last[1])}</strong>}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} during training`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} className="viz-gridline" />
            <text x={L - 6} y={sy(t) + 4} textAnchor="end" className="tick">
              {format(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={sx(t)} y={H - B + 16} textAnchor="middle" className="tick">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </text>
        ))}
        <text x={W - R} y={H - 2} textAnchor="end" className="tick">
          epochs
        </text>
        <line x1={L} x2={W - R} y1={sy(0)} y2={sy(0)} className="viz-axisline" />
        {threshold !== undefined && (
          <g>
            <line x1={L} x2={W - R} y1={sy(threshold)} y2={sy(threshold)} className="train-threshold" />
            <text x={L + 6} y={sy(threshold) - 5} className="tick train-threshold-label">
              pass mark (test set) {format(threshold)}
            </text>
          </g>
        )}
        <path d={rawPath} className="train-raw" />
        <path d={path(smoothXY)} className="train-smooth" />
        {final !== undefined && final !== null && (
          <g>
            <circle cx={sx(epochs)} cy={sy(final)} r={5} className="train-final" />
            <text x={sx(epochs) - 8} y={sy(final) + 16} textAnchor="end" className="tick train-final-label">
              test {format(final)}
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}

export function TrainingCurves({
  points,
  epochs,
  threshold,
  testAccuracy,
}: {
  points: ProgressPoint[];
  epochs: number;
  threshold: number;
  testAccuracy: number | null;
}) {
  let maxLoss = 0;
  for (const p of points) if (p[3] !== null) maxLoss = Math.max(maxLoss, p[3]);
  const lossMax = Math.min(5, Math.max(1, Math.ceil(maxLoss * 2) / 2));
  const step = lossMax > 3 ? 1 : 0.5;
  const lossTicks = Array.from({ length: Math.floor(lossMax / step) + 1 }, (_, i) => i * step);
  return (
    <div className="train-curves">
      <Chart
        title="Training loss"
        points={points}
        col={3}
        epochs={epochs}
        yMax={lossMax}
        ticks={lossTicks}
        format={(v) => v.toFixed(v >= 1 ? 2 : 3)}
      />
      <Chart
        title="Training accuracy"
        points={points}
        col={4}
        epochs={epochs}
        yMax={1}
        ticks={[0, 0.25, 0.5, 0.75, 1]}
        format={(v) => `${(v * 100).toFixed(v === 1 || v === 0 ? 0 : 1)}%`}
        threshold={threshold}
        final={testAccuracy}
      />
    </div>
  );
}
