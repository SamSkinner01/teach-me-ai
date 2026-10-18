import { useCallback, useMemo, useState } from "react";
import { Tex } from "../components/RichText";
import { Figure, Segmented, Slider, clamp, fmt, linear, useSvgDrag } from "./common";

interface Fn {
  label: string;
  tex: string;
  dtex: string;
  f: (x: number) => number;
  df: (x: number) => number;
  domain: [number, number];
  x0: number;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const FUNCTIONS: Record<string, Fn> = {
  square: { label: "x²", tex: "x^2", dtex: "2x", f: (x) => x * x, df: (x) => 2 * x, domain: [-3, 3], x0: 1 },
  cubic: {
    label: "x³ − 3x",
    tex: "x^3 - 3x",
    dtex: "3x^2 - 3",
    f: (x) => x ** 3 - 3 * x,
    df: (x) => 3 * x * x - 3,
    domain: [-2.5, 2.5],
    x0: 1.6,
  },
  sin: { label: "sin x", tex: "\\sin x", dtex: "\\cos x", f: Math.sin, df: Math.cos, domain: [-5, 5], x0: 0.8 },
  exp: { label: "eˣ", tex: "e^x", dtex: "e^x", f: Math.exp, df: Math.exp, domain: [-3, 2], x0: 0.5 },
  sigmoid: {
    label: "σ(x)",
    tex: "\\sigma(x)",
    dtex: "\\sigma(x)(1-\\sigma(x))",
    f: sigmoid,
    df: (x) => sigmoid(x) * (1 - sigmoid(x)),
    domain: [-7, 7],
    x0: 1,
  },
};

/** Plain decimals for visible errors, scientific notation for tiny ones. */
function errorTex(e: number): string {
  if (e < 1e-12) return "0";
  if (e >= 1e-3) return fmt(e, 4);
  const [mantissa, exp] = e.toExponential(2).split("e");
  return `${mantissa} \\times 10^{${Number(exp)}}`;
}

const W = 640;
const H = 340;
const PAD = 28;

function range(f: (x: number) => number, lo: number, hi: number): [number, number] {
  let ymin = Infinity;
  let ymax = -Infinity;
  for (let i = 0; i <= 200; i++) {
    const y = f(lo + ((hi - lo) * i) / 200);
    if (Number.isFinite(y)) {
      ymin = Math.min(ymin, y);
      ymax = Math.max(ymax, y);
    }
  }
  if (ymax - ymin < 1e-9) {
    ymin -= 1;
    ymax += 1;
  }
  const pad = (ymax - ymin) * 0.12;
  return [ymin - pad, ymax + pad];
}

function path(f: (x: number) => number, lo: number, hi: number, sx: (x: number) => number, sy: (y: number) => number) {
  const pts: string[] = [];
  for (let i = 0; i <= 300; i++) {
    const x = lo + ((hi - lo) * i) / 300;
    const y = f(x);
    if (Number.isFinite(y)) pts.push(`${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`);
  }
  return pts.join(" ");
}

export function DerivativeExplorer({
  fn: initial = "square",
  choose = true,
  showDerivative = false,
}: {
  fn?: keyof typeof FUNCTIONS;
  choose?: boolean;
  showDerivative?: boolean;
}) {
  const [key, setKey] = useState<string>(initial);
  const F = FUNCTIONS[key];
  const [x0, setX0] = useState(F.x0);
  const [logH, setLogH] = useState(0); // h = 10^logH
  const [method, setMethod] = useState<"forward" | "central">("forward");
  const [zoom, setZoom] = useState<"1" | "10" | "100">("1");

  const h = Math.pow(10, logH);
  const z = Number(zoom);
  const [d0, d1] = F.domain;
  const half = (d1 - d0) / 2 / z;
  const lo = z === 1 ? d0 : x0 - half;
  const hi = z === 1 ? d1 : x0 + half;
  const [ymin, ymax] = useMemo(() => range(F.f, lo, hi), [F, lo, hi]);

  const sx = linear(lo, hi, PAD, W - PAD);
  const sy = linear(ymin, ymax, H - PAD, PAD);

  // While zoomed in the window is centred on the point, so dragging pans along the curve.
  const drag = useSvgDrag(
    useCallback(
      (px: number) => {
        const x = lo + ((px - PAD) / (W - 2 * PAD)) * (hi - lo);
        setX0(Number(clamp(x, d0 + 0.05, d1 - 0.05).toFixed(3)));
      },
      [lo, hi, d0, d1],
    ),
  );

  const fx = F.f(x0);
  const truth = F.df(x0);
  const fwd = (F.f(x0 + h) - fx) / h;
  const ctr = (F.f(x0 + h) - F.f(x0 - h)) / (2 * h);
  const est = method === "forward" ? fwd : ctr;
  const p1x = method === "forward" ? x0 : x0 - h;
  const p2x = x0 + h;

  const lineThrough = (x: number, y: number, slope: number) => ({
    x1: sx(lo),
    y1: sy(y + slope * (lo - x)),
    x2: sx(hi),
    y2: sy(y + slope * (hi - x)),
  });
  const secant = lineThrough(p1x, F.f(p1x), est);
  const tangent = lineThrough(x0, fx, truth);

  // derivative plot
  const [dmin, dmax] = useMemo(() => range(F.df, lo, hi), [F, lo, hi]);
  const DH = 150;
  const dy = linear(dmin, dmax, DH - 16, 12);

  return (
    <Figure
      title={showDerivative ? `The derivative of ${F.label}` : "From secant to tangent"}
      caption={
        <>
          Drag across the plot to move the point. Shrink <Tex>h</Tex> and the{" "}
          <span style={{ color: "var(--viz-b)" }}>secant line</span> through two nearby points turns into the{" "}
          <span style={{ color: "var(--viz-c)" }}>tangent line</span>, whose slope is the derivative. Zoom in and the
          curve itself looks straight.
        </>
      }
      controls={
        <>
          {choose && (
            <Segmented
              label="Function"
              value={key}
              onChange={(k) => {
                setKey(k);
                setX0(FUNCTIONS[k].x0);
              }}
              options={Object.entries(FUNCTIONS).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          )}
          <Segmented
            label="Method"
            value={method}
            onChange={setMethod}
            options={[
              { value: "forward", label: "forward" },
              { value: "central", label: "central" },
            ]}
          />
          <Slider label={<Tex>h</Tex>} value={logH} min={-3} max={0.3} step={0.05} onChange={setLogH} format={() => fmt(h, 4)} />
          <Segmented
            label="Zoom"
            value={zoom}
            onChange={setZoom}
            options={[
              { value: "1", label: "1×" },
              { value: "10", label: "10×" },
              { value: "100", label: "100×" },
            ]}
          />
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg wide-plot" role="img" aria-label="Function plot" {...drag}>
        <rect x={0} y={0} width={W} height={H} className="viz-bg" />
        {ymin < 0 && ymax > 0 && <line x1={PAD} x2={W - PAD} y1={sy(0)} y2={sy(0)} className="viz-axisline" />}
        {lo < 0 && hi > 0 && <line y1={PAD} y2={H - PAD} x1={sx(0)} x2={sx(0)} className="viz-axisline" />}
        <path d={path(F.f, lo, hi, sx, sy)} className="viz-curve" />
        <line {...tangent} className="viz-tangent" />
        <line {...secant} className="viz-secant" />
        <circle cx={sx(p1x)} cy={sy(F.f(p1x))} r={4.5} style={{ fill: "var(--viz-b)" }} />
        <circle cx={sx(p2x)} cy={sy(F.f(p2x))} r={4.5} style={{ fill: "var(--viz-b)" }} />
        <circle cx={sx(x0)} cy={sy(fx)} r={6} className="viz-point" />
        <text x={W - PAD} y={PAD - 8} textAnchor="end" className="tick">
          {fmt(lo, 2)} ≤ x ≤ {fmt(hi, 2)}
        </text>
      </svg>

      {showDerivative && (
        <svg viewBox={`0 0 ${W} ${DH}`} className="viz-svg wide-plot deriv-plot" role="img" aria-label="Derivative plot">
          <rect x={0} y={0} width={W} height={DH} className="viz-bg" />
          {dmin < 0 && dmax > 0 && <line x1={PAD} x2={W - PAD} y1={dy(0)} y2={dy(0)} className="viz-axisline" />}
          <path d={path(F.df, lo, hi, sx, dy)} className="viz-curve deriv" />
          <line x1={sx(x0)} x2={sx(x0)} y1={8} y2={DH - 8} className="viz-dashed" style={{ stroke: "var(--viz-axis)" }} />
          <circle cx={sx(x0)} cy={dy(truth)} r={5} style={{ fill: "var(--viz-c)" }} />
          <text x={PAD} y={16} className="tick">
            slope f′(x)
          </text>
        </svg>
      )}

      <div className="readout-strip">
        <div>
          <span className="muted small">point</span>
          <Tex>{`x = ${fmt(x0)},\\ f(x) = ${fmt(fx)}`}</Tex>
        </div>
        <div>
          <span className="muted small" style={{ color: "var(--viz-b)" }}>
            {method} difference
          </span>
          <Tex>{method === "forward" ? `\\frac{f(x+h) - f(x)}{h} = ${fmt(fwd, 5)}` : `\\frac{f(x+h) - f(x-h)}{2h} = ${fmt(ctr, 5)}`}</Tex>
        </div>
        <div>
          <span className="muted small" style={{ color: "var(--viz-c)" }}>
            true derivative
          </span>
          <Tex>{`f'(x) = ${F.dtex} = ${fmt(truth, 5)}`}</Tex>
        </div>
        <div>
          <span className="muted small">error</span>
          <Tex>{errorTex(Math.abs(est - truth))}</Tex>
        </div>
      </div>
    </Figure>
  );
}
