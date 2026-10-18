import { useMemo, useState } from "react";
import { Tex } from "../components/RichText";
import { Figure, Segmented, fmt, linear } from "./common";
import { Rng } from "./random";

const density = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** Uniforms → Box–Muller → a bell curve. */
export function NormalViz() {
  const [n, setN] = useState("1000");
  const count = Number(n);
  const z = useMemo(() => {
    const rng = new Rng(2463534242);
    return Array.from({ length: count }, () => rng.normal());
  }, [count]);

  const W = 420;
  const H = 230;
  const BINS = 40;
  const sx = linear(-4, 4, 10, W - 10);
  const bins = new Array(BINS).fill(0);
  for (const v of z) {
    const b = Math.floor(((v + 4) / 8) * BINS);
    if (b >= 0 && b < BINS) bins[b]++;
  }
  const width = 8 / BINS;
  const dens = bins.map((c) => c / (count * width));
  const sy = linear(0, Math.max(0.45, ...dens) * 1.05, H - 20, 8);
  const curve: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = -4 + (8 * i) / 200;
    curve.push(`${sx(x).toFixed(1)},${sy(density(x)).toFixed(1)}`);
  }
  const mean = z.reduce((a, b) => a + b, 0) / count;
  const std = Math.sqrt(z.reduce((a, b) => a + (b - mean) ** 2, 0) / count);

  const S = 220;
  const px = linear(-4, 4, 6, S - 6);
  const py = linear(-4, 4, S - 6, 6);

  return (
    <Figure
      title="Box–Muller: uniform in, bell curve out"
      caption="These numbers come from xorshift32 uniforms pushed through the Box–Muller formulas, the same code you're about to write. The histogram follows the bell curve more closely as the sample grows. Plotting the pairs (z₁, z₂) gives a round cloud: Box–Muller really makes a random point in the plane at a random angle θ and distance r."
      controls={
        <Segmented
          label="Sample size"
          value={n}
          onChange={setN}
          options={["100", "1000", "10000", "100000"].map((v) => ({ value: v, label: Number(v).toLocaleString() }))}
        />
      }
    >
      <div className="rng-grid normal-grid">
        <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Histogram of normal samples">
          <line x1={10} x2={W - 10} y1={sy(0)} y2={sy(0)} className="viz-axisline" />
          {dens.map((d, i) => (
            <rect key={i} x={sx(-4 + i * width) + 0.5} y={sy(d)} width={sx(width) - sx(0) - 1} height={sy(0) - sy(d)} className="bar-obs" />
          ))}
          <path d={"M" + curve.join("L")} className="viz-curve deriv" />
          {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
            <text key={t} x={sx(t)} y={H - 5} className="tick" textAnchor="middle">
              {fmt(t)}
            </text>
          ))}
        </svg>
        <svg viewBox={`0 0 ${S} ${S}`} className="viz-svg square rng-scatter" role="img" aria-label="Pairs of normal samples">
          <line x1={px(-4)} x2={px(4)} y1={py(0)} y2={py(0)} className="viz-axisline faint" />
          <line y1={py(-4)} y2={py(4)} x1={px(0)} x2={px(0)} className="viz-axisline faint" />
          {Array.from({ length: Math.min(1500, Math.floor(count / 2)) }, (_, i) => (
            <circle key={i} cx={px(z[2 * i])} cy={py(z[2 * i + 1])} r={1.4} className="rng-dot" />
          ))}
        </svg>
      </div>
      <div className="readout-strip">
        <div>
          <span className="muted small">sample mean (should be ≈ 0)</span>
          <Tex>{fmt(mean, 4)}</Tex>
        </div>
        <div>
          <span className="muted small">sample std (should be ≈ 1)</span>
          <Tex>{fmt(std, 4)}</Tex>
        </div>
        <div>
          <span className="muted small">Box–Muller</span>
          <Tex>{`r = \\sqrt{-2\\ln u_1},\\ \\theta = 2\\pi u_2`}</Tex>
        </div>
      </div>
    </Figure>
  );
}

const WIDTH = 100;
const DEPTH = 10;
const BATCH = 200;

type Act = "tanh" | "relu";
type Init = "small" | "large" | "xavier" | "he";

const INITS: { value: Init; label: string; sigma: (n: number) => number; tex: string }[] = [
  { value: "small", label: "σ = 0.01", sigma: () => 0.01, tex: "\\sigma = 0.01" },
  { value: "large", label: "σ = 1", sigma: () => 1, tex: "\\sigma = 1" },
  { value: "xavier", label: "Xavier √(1/n)", sigma: (n) => Math.sqrt(1 / n), tex: "\\sigma = \\sqrt{1/n}" },
  { value: "he", label: "He √(2/n)", sigma: (n) => Math.sqrt(2 / n), tex: "\\sigma = \\sqrt{2/n}" },
];

function forward(act: Act, init: Init): { values: Float64Array; std: number }[] {
  const rng = new Rng(1234567);
  const sigma = INITS.find((i) => i.value === init)!.sigma(WIDTH);
  let h = new Float64Array(BATCH * WIDTH);
  for (let i = 0; i < h.length; i++) h[i] = rng.normal();
  const layers: { values: Float64Array; std: number }[] = [];
  for (let l = 0; l < DEPTH; l++) {
    const W = new Float64Array(WIDTH * WIDTH);
    for (let i = 0; i < W.length; i++) W[i] = rng.normal() * sigma;
    const out = new Float64Array(BATCH * WIDTH);
    for (let b = 0; b < BATCH; b++) {
      for (let o = 0; o < WIDTH; o++) {
        let s = 0;
        for (let i = 0; i < WIDTH; i++) s += W[o * WIDTH + i] * h[b * WIDTH + i];
        out[b * WIDTH + o] = act === "tanh" ? Math.tanh(s) : s > 0 ? s : 0;
      }
    }
    let m = 0;
    for (const v of out) m += v;
    m /= out.length;
    let v2 = 0;
    for (const v of out) v2 += (v - m) ** 2;
    layers.push({ values: out, std: Math.sqrt(v2 / out.length) });
    h = out;
  }
  return layers;
}

function MiniHist({ values, act }: { values: Float64Array; act: Act }) {
  const W = 110;
  const H = 56;
  const BINS = 24;
  let lo = act === "tanh" ? -1 : 0;
  let hi = 1;
  if (act === "relu") {
    let max = 0;
    for (const v of values) if (v > max) max = v;
    hi = max > 0 ? max : 1;
  }
  const bins = new Array(BINS).fill(0);
  for (const v of values) {
    const b = Math.floor(((v - lo) / (hi - lo)) * BINS);
    bins[Math.max(0, Math.min(BINS - 1, b))]++;
  }
  // For ReLU, the spike of exact zeros dwarfs everything; skip it when scaling.
  const scaleMax = act === "relu" ? Math.max(1, ...bins.slice(1)) : Math.max(...bins);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="mini-hist" aria-hidden="true">
        {bins.map((c, i) => {
          const h = Math.min(1, c / scaleMax) * (H - 2);
          return <rect key={i} x={i * (W / BINS)} y={H - h} width={W / BINS - 0.8} height={h} className="bar-obs" />;
        })}
      </svg>
      <span className="mini-range mono">
        <span>{act === "relu" ? "0" : "−1"}</span>
        <span>{act === "relu" ? (hi < 0.01 ? hi.toExponential(0) : fmt(hi, 2)) : "1"}</span>
      </span>
    </>
  );
}

export function InitViz() {
  const [act, setAct] = useState<Act>("tanh");
  const [init, setInit] = useState<Init>("small");
  const layers = useMemo(() => forward(act, init), [act, init]);
  const last = layers[layers.length - 1].std;
  const meta = INITS.find((i) => i.value === init)!;

  // std per layer on a log scale
  const CW = 460;
  const CH = 150;
  const ly = linear(-6, 3, CH - 20, 10);
  const lx = linear(0, DEPTH, 40, CW - 10);
  const logStd = (s: number) => Math.max(-6, Math.min(3, Math.log10(s || 1e-12)));

  // Thresholds calibrated against a NumPy simulation of all eight combinations.
  const ratio = last / layers[0].std;
  let verdict: string;
  if (last < 1e-3)
    verdict = "Vanishing: the signal shrinks by the same factor at every layer until almost nothing reaches the end. Gradients vanish the same way on the way back, so the early layers barely learn.";
  else if (act === "tanh" && last > 0.85)
    verdict = "Saturating: most values are pinned at ±1, where tanh is flat. Its derivative is ≈ 0 there, so learning stalls.";
  else if (last > 50 || ratio > 20) verdict = "Exploding: values grow by the same factor at every layer. Training would blow up.";
  else if (ratio < 0.2)
    verdict = "Fading: ReLU zeroes about half its inputs, which halves the variance at every layer, so the signal slowly dies out. He initialization doubles σ² to make up for exactly that.";
  else verdict = "Healthy: the values keep a reasonable spread all the way through, so signals (and gradients) survive the whole depth.";

  return (
    <Figure
      title="What the starting weights do to a deep network"
      caption={`200 random inputs pass through ${DEPTH} layers of ${WIDTH} neurons each, with weights drawn from a normal distribution with standard deviation σ. Each small histogram shows the values coming out of one layer. Try every combination.`}
      controls={
        <>
          <Segmented
            label="Activation"
            value={act}
            onChange={setAct}
            options={[
              { value: "tanh", label: "tanh" },
              { value: "relu", label: "ReLU" },
            ]}
          />
          <Segmented label="Initialization" value={init} onChange={setInit} options={INITS.map((i) => ({ value: i.value, label: i.label }))} />
        </>
      }
    >
      <div className="init-layers">
        {layers.map((l, i) => (
          <div key={i} className="init-layer">
            <span className="small muted">layer {i + 1}</span>
            <MiniHist values={l.values} act={act} />
            <span className="mono small">std {l.std < 1e-3 ? l.std.toExponential(1) : fmt(l.std, 3)}</span>
          </div>
        ))}
      </div>
      <div className="init-bottom">
        <svg viewBox={`0 0 ${CW} ${CH}`} className="viz-svg init-chart" role="img" aria-label="Standard deviation per layer">
          {[-6, -3, 0, 3].map((t) => (
            <g key={t}>
              <line x1={40} x2={CW - 10} y1={ly(t)} y2={ly(t)} className={t === 0 ? "viz-axisline" : "viz-gridline"} />
              <text x={34} y={ly(t) + 4} textAnchor="end" className="tick">
                {t === 0 ? "1" : `10${t < 0 ? "⁻" : ""}${["⁰", "¹", "²", "³", "⁴", "⁵", "⁶"][Math.abs(t)]}`}
              </text>
            </g>
          ))}
          <path
            d={"M" + layers.map((l, i) => `${lx(i + 1).toFixed(1)},${ly(logStd(l.std)).toFixed(1)}`).join("L")}
            className="running-path"
          />
          {layers.map((l, i) => (
            <circle key={i} cx={lx(i + 1)} cy={ly(logStd(l.std))} r={3.5} style={{ fill: "var(--viz-b)" }} />
          ))}
          <text x={CW - 10} y={CH - 4} textAnchor="end" className="tick">
            layer →
          </text>
          <text x={44} y={12} className="tick">
            std of each layer's output (log scale)
          </text>
        </svg>
        <div className="viz-readout">
          <div className="readout-big">
            <Tex>{`${meta.tex},\\ n = ${WIDTH}`}</Tex>
          </div>
          <div className="readout-note">{verdict}</div>
        </div>
      </div>
    </Figure>
  );
}
