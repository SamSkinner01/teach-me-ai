import { useEffect, useRef, useState } from "react";
import { Tex } from "../components/RichText";
import { cssVar, useTheme } from "../state/theme";
import { Figure, Segmented, Slider, fmt, linear } from "./common";

// ---------------------------------------------------------------------------
// Activation functions
// ---------------------------------------------------------------------------

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const ACTS: Record<string, { label: string; f: (x: number) => number; df: (x: number) => number; tex: string }> = {
  relu: { label: "ReLU", f: (x) => Math.max(0, x), df: (x) => (x > 0 ? 1 : 0), tex: "\\max(0, x)" },
  leaky: { label: "Leaky ReLU", f: (x) => (x > 0 ? x : 0.1 * x), df: (x) => (x > 0 ? 1 : 0.1), tex: "\\max(0.1x,\\ x)" },
  sigmoid: { label: "Sigmoid", f: sigmoid, df: (x) => sigmoid(x) * (1 - sigmoid(x)), tex: "\\frac{1}{1+e^{-x}}" },
  tanh: { label: "tanh", f: Math.tanh, df: (x) => 1 - Math.tanh(x) ** 2, tex: "\\tanh x" },
};

export function ActivationViz() {
  const [key, setKey] = useState("relu");
  const A = ACTS[key];
  const W = 520;
  const H = 260;
  const sx = linear(-4, 4, 20, W - 20);
  const sy = linear(-1.5, 4, H - 16, 12);
  const path = (g: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = -4 + (8 * i) / 200;
      pts.push(`${sx(x).toFixed(1)},${sy(g(x)).toFixed(1)}`);
    }
    return "M" + pts.join("L");
  };
  return (
    <Figure
      title="Activation functions"
      caption="The blue curve is the activation; the dashed green curve is its slope (derivative). During backpropagation, every gradient passing through a neuron is multiplied by that slope. Where the slope is near 0, learning stalls."
      controls={
        <Segmented
          label="Activation"
          value={key}
          onChange={setKey}
          options={Object.entries(ACTS).map(([k, a]) => ({ value: k, label: a.label }))}
        />
      }
    >
      <div className="viz-split">
        <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label={`${A.label} and its derivative`}>
          <line x1={20} x2={W - 20} y1={sy(0)} y2={sy(0)} className="viz-axisline" />
          <line x1={sx(0)} x2={sx(0)} y1={12} y2={H - 16} className="viz-axisline" />
          {[1, 2, 3].map((t) => (
            <text key={t} x={sx(0) - 6} y={sy(t) + 4} className="tick" textAnchor="end">
              {t}
            </text>
          ))}
          <path d={path(A.df)} className="viz-tangent" fill="none" />
          <path d={path(A.f)} className="viz-curve" />
        </svg>
        <div className="viz-readout">
          <div className="readout-big">
            <Tex>{`${A.label === "tanh" ? "" : "\\text{" + A.label + "}(x) = "}${A.tex}`}</Tex>
          </div>
          <div className="readout-note">
            {key === "relu" &&
              "Cheap to compute, and its slope is exactly 1 for every positive input, so gradients pass through undiminished. The default choice for hidden layers. Its weakness: a neuron whose input is always negative gets zero gradient and can “die”."}
            {key === "leaky" && "Like ReLU, but negative inputs keep a small slope (here 0.1), so a neuron can never go completely silent."}
            {key === "sigmoid" &&
              "Squashes everything into (0, 1). Its slope is at most ¼ and nearly 0 for large |x|, so stacking many sigmoid layers makes gradients vanish. Today it's mostly used for outputs that are probabilities."}
            {key === "tanh" && "Like a sigmoid stretched to (−1, 1) and centred at 0. A slope of up to 1 is better, but it still saturates for large |x|."}
          </div>
        </div>
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// A single neuron's decision boundary
// ---------------------------------------------------------------------------

const DATASETS: Record<string, { label: string; points: [number, number, number][] }> = {
  separable: {
    label: "Two clusters",
    points: [
      [-1.5, -1, 0], [-1, -1.6, 0], [-2, -0.4, 0], [-0.6, -0.8, 0], [-1.4, 0.2, 0],
      [1.2, 1, 1], [0.8, 1.7, 1], [1.8, 0.6, 1], [0.5, 0.9, 1], [1.5, -0.1, 1],
    ],
  },
  xor: {
    label: "XOR",
    points: [
      [-1.2, -1.2, 0], [-1.6, -0.8, 0], [1.2, 1.2, 0], [1.6, 0.8, 0],
      [-1.2, 1.2, 1], [-0.8, 1.6, 1], [1.2, -1.2, 1], [0.8, -1.6, 1],
    ],
  },
};

function hexRgb(c: string): [number, number, number] {
  const m = c.match(/^#([0-9a-f]{6})$/i);
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function NeuronViz() {
  const [data, setData] = useState("separable");
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(-0.5);
  const [b, setB] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const S = 300;
  const R = 2.5;
  const sx = linear(-R, R, 0, S);
  const sy = linear(-R, R, S, 0);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const RES = 100;
    const c0 = hexRgb(cssVar("--viz-a"));
    const c1 = hexRgb(cssVar("--viz-b"));
    const bg = hexRgb(cssVar("--surface"));
    const img = ctx.createImageData(RES, RES);
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        const x = -R + (2 * R * (i + 0.5)) / RES;
        const y = R - (2 * R * (j + 0.5)) / RES;
        const p = sigmoid(w1 * x + w2 * y + b);
        const strength = Math.abs(p - 0.5) * 2 * 0.45;
        const col = p > 0.5 ? c1 : c0;
        const k = (j * RES + i) * 4;
        for (let c = 0; c < 3; c++) img.data[k + c] = bg[c] * (1 - strength) + col[c] * strength;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [w1, w2, b, theme]);

  const pts = DATASETS[data].points;
  const correct = pts.filter(([x, y, c]) => (w1 * x + w2 * y + b > 0 ? 1 : 0) === c).length;
  // boundary line w1 x + w2 y + b = 0, clipped to the view
  const line: [number, number][] = [];
  if (Math.abs(w2) > 1e-6) {
    for (const x of [-R, R]) line.push([x, -(w1 * x + b) / w2]);
  } else if (Math.abs(w1) > 1e-6) {
    for (const y of [-R, R]) line.push([-b / w1, y]);
  }

  return (
    <Figure
      title="What one neuron can do"
      caption="A neuron computes σ(w₁x + w₂y + b). Its decision boundary, where the output is exactly ½, is always a straight line. Adjust the weights to separate the orange points from the blue ones. It's easy for two clusters and impossible for XOR, which is why we need layers."
      controls={
        <>
          <Segmented
            label="Dataset"
            value={data}
            onChange={setData}
            options={Object.entries(DATASETS).map(([k, d]) => ({ value: k, label: d.label }))}
          />
          <Slider label={<Tex>{"w_1"}</Tex>} value={w1} min={-3} max={3} step={0.05} onChange={setW1} width={130} />
          <Slider label={<Tex>{"w_2"}</Tex>} value={w2} min={-3} max={3} step={0.05} onChange={setW2} width={130} />
          <Slider label={<Tex>{"b"}</Tex>} value={b} min={-3} max={3} step={0.05} onChange={setB} width={130} />
        </>
      }
    >
      <div className="viz-split">
        <div className="gf-stage neuron-stage">
          <canvas ref={canvas} width={100} height={100} className="gf-canvas" aria-hidden="true" />
          <svg viewBox={`0 0 ${S} ${S}`} className="viz-svg square gf-overlay" role="img" aria-label="Decision boundary">
            {line.length === 2 && (
              <line x1={sx(line[0][0])} y1={sy(line[0][1])} x2={sx(line[1][0])} y2={sy(line[1][1])} className="boundary-line" />
            )}
            {pts.map(([x, y, c], i) => (
              <circle key={i} cx={sx(x)} cy={sy(y)} r={7} className={`class-dot c${c}`} />
            ))}
          </svg>
        </div>
        <div className="viz-readout">
          <div className="readout-big">
            {correct} of {pts.length} classified correctly
          </div>
          <div className="readout-row">
            <Tex>{`z = ${fmt(w1, 2)}\\,x ${w2 < 0 ? "-" : "+"} ${fmt(Math.abs(w2), 2)}\\,y ${b < 0 ? "-" : "+"} ${fmt(Math.abs(b), 2)}`}</Tex>
          </div>
          <div className="readout-note">
            {data === "xor"
              ? correct === pts.length
                ? "Wait, really?"
                : "No straight line can put both orange corners on one side and both blue corners on the other. The best a single neuron can do is 6 of 8."
              : correct === pts.length
                ? "Separated. The weights (w₁, w₂) point across the boundary towards the orange side; b slides the line."
                : "Keep going: tilt the line with w₁ and w₂, slide it with b."}
          </div>
        </div>
      </div>
    </Figure>
  );
}
