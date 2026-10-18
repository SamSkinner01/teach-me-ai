import { useState } from "react";
import { Tex } from "../components/RichText";
import { Figure, Slider } from "./common";

// ---------------------------------------------------------------------------
// A two-layer network that computes XOR, with visible values
// ---------------------------------------------------------------------------

const W1 = [
  [1, 1],
  [1, 1],
];
const B1 = [0, -1];
const W2 = [1, -2];

export function XorNetViz() {
  const [x, setX] = useState<[number, number]>([1, 0]);
  const z = W1.map((row, j) => row[0] * x[0] + row[1] * x[1] + B1[j]);
  const h = z.map((v) => Math.max(0, v));
  const y = W2[0] * h[0] + W2[1] * h[1];

  const nodes = {
    x0: [70, 80],
    x1: [70, 200],
    h0: [270, 80],
    h1: [270, 200],
    y: [470, 140],
  } as const;
  const edges: { from: keyof typeof nodes; to: keyof typeof nodes; w: number }[] = [
    { from: "x0", to: "h0", w: W1[0][0] },
    { from: "x1", to: "h0", w: W1[0][1] },
    { from: "x0", to: "h1", w: W1[1][0] },
    { from: "x1", to: "h1", w: W1[1][1] },
    { from: "h0", to: "y", w: W2[0] },
    { from: "h1", to: "y", w: W2[1] },
  ];
  const value: Record<string, number> = { x0: x[0], x1: x[1], h0: h[0], h1: h[1], y };

  return (
    <Figure
      title="Two layers solve XOR"
      caption="Click the inputs to toggle them between 0 and 1. The first hidden neuron fires when at least one input is on; the second only when both are (its bias of −1 has to be overcome). The output takes the first minus twice the second: on for exactly one input, off for none or both. That's XOR, which no single neuron could compute."
    >
      <svg viewBox="0 0 560 280" className="viz-svg wide-plot" role="img" aria-label="XOR network">
        {edges.map((e, i) => {
          const [x1, y1] = nodes[e.from];
          const [x2, y2] = nodes[e.to];
          const active = value[e.from] !== 0;
          return (
            <g key={i}>
              <line x1={x1 + 30} y1={y1} x2={x2 - 30} y2={y2} className={`nn-edge ${e.w < 0 ? "neg" : "pos"} ${active ? "active" : ""}`} />
              {/* 30% along the edge, so labels on crossing edges don't collide */}
              <text x={x1 + 30 + (x2 - x1 - 60) * 0.3} y={y1 + (y2 - y1) * 0.3 - 6} className="nn-weight" textAnchor="middle">
                {e.w > 0 ? `+${e.w}` : e.w}
              </text>
            </g>
          );
        })}
        {(["x0", "x1"] as const).map((k, i) => (
          <g key={k} className="nn-input" onClick={() => setX(i === 0 ? [1 - x[0], x[1]] : [x[0], 1 - x[1]])} role="button" aria-label={`toggle input ${i + 1}`}>
            <circle cx={nodes[k][0]} cy={nodes[k][1]} r={30} className={`nn-node ${value[k] ? "on" : ""}`} />
            <text x={nodes[k][0]} y={nodes[k][1] + 6} textAnchor="middle" className="nn-value">
              {value[k]}
            </text>
            <text x={nodes[k][0]} y={nodes[k][1] - 40} textAnchor="middle" className="tick">
              input x{i + 1} (click)
            </text>
          </g>
        ))}
        {(["h0", "h1"] as const).map((k, j) => (
          <g key={k}>
            <circle cx={nodes[k][0]} cy={nodes[k][1]} r={30} className={`nn-node ${value[k] > 0 ? "on" : ""}`} />
            <text x={nodes[k][0]} y={nodes[k][1] + 6} textAnchor="middle" className="nn-value">
              {value[k]}
            </text>
            <text x={nodes[k][0]} y={nodes[k][1] + 48} textAnchor="middle" className="tick">
              relu({z[j]}) · bias {B1[j]}
            </text>
          </g>
        ))}
        <circle cx={nodes.y[0]} cy={nodes.y[1]} r={30} className={`nn-node out ${y > 0.5 ? "on" : ""}`} />
        <text x={nodes.y[0]} y={nodes.y[1] + 6} textAnchor="middle" className="nn-value">
          {y}
        </text>
        <text x={nodes.y[0]} y={nodes.y[1] - 40} textAnchor="middle" className="tick">
          output
        </text>
      </svg>
      <div className="xor-table">
        {[
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ].map(([a, c]) => {
          const hh = W1.map((row, j) => Math.max(0, row[0] * a + row[1] * c + B1[j]));
          const out = W2[0] * hh[0] + W2[1] * hh[1];
          const current = a === x[0] && c === x[1];
          return (
            <button key={`${a}${c}`} className={`xor-row ${current ? "current" : ""}`} onClick={() => setX([a, c])}>
              <span className="mono">
                {a} XOR {c}
              </span>
              <span className="mono">= {out}</span>
            </button>
          );
        })}
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// Shapes through a dense layer, forward and backward
// ---------------------------------------------------------------------------

function Box({ label, shape, tone }: { label: string; shape: string; tone: string }) {
  return (
    <div className={`shape-box ${tone}`}>
      <Tex>{label}</Tex>
      <span className="mono small">{shape}</span>
    </div>
  );
}

export function BackpropShapesViz() {
  const [n, setN] = useState(32);
  const [inp, setInp] = useState(784);
  const [out, setOut] = useState(64);
  return (
    <Figure
      title="Following the shapes"
      caption="A dense layer z = x·Wᵀ + b, with its shapes. Every gradient has exactly the same shape as the thing it's the gradient of, and that rule alone tells you which matrix products (and transposes) backpropagation needs. Change the sizes and check that each product's inner dimensions match."
      controls={
        <>
          <Slider label="batch N" value={n} min={1} max={128} step={1} onChange={setN} format={String} width={130} />
          <Slider label="inputs" value={inp} min={1} max={784} step={1} onChange={setInp} format={String} width={130} />
          <Slider label="neurons" value={out} min={1} max={128} step={1} onChange={setOut} format={String} width={130} />
        </>
      }
    >
      <div className="shape-grid">
        <div className="shape-col">
          <div className="shape-head">forward</div>
          <div className="shape-eq">
            <Box label="x" shape={`${n}×${inp}`} tone="a" />
            <span>·</span>
            <Box label="W^\mathsf{T}" shape={`${inp}×${out}`} tone="b" />
            <span>+</span>
            <Box label="b" shape={`${out}`} tone="b" />
            <span>=</span>
            <Box label="z" shape={`${n}×${out}`} tone="c" />
          </div>
        </div>
        <div className="shape-col">
          <div className="shape-head">backward (given dL/dz)</div>
          <div className="shape-eq">
            <Box label="\frac{\partial L}{\partial x}" shape={`${n}×${inp}`} tone="a" />
            <span>=</span>
            <Box label="\frac{\partial L}{\partial z}" shape={`${n}×${out}`} tone="c" />
            <span>·</span>
            <Box label="W" shape={`${out}×${inp}`} tone="b" />
          </div>
          <div className="shape-eq">
            <Box label="\frac{\partial L}{\partial W}" shape={`${out}×${inp}`} tone="b" />
            <span>=</span>
            <Box label="(\frac{\partial L}{\partial z})^\mathsf{T}" shape={`${out}×${n}`} tone="c" />
            <span>·</span>
            <Box label="x" shape={`${n}×${inp}`} tone="a" />
          </div>
          <div className="shape-eq">
            <Box label="\frac{\partial L}{\partial b}" shape={`${out}`} tone="b" />
            <span>=</span>
            <span className="small">sum of the {n} rows of</span>
            <Box label="\frac{\partial L}{\partial z}" shape={`${n}×${out}`} tone="c" />
          </div>
        </div>
      </div>
      <div className="readout-strip">
        <div>
          <span className="muted small">weights in this layer</span>
          <strong>{(out * inp + out).toLocaleString()}</strong>
        </div>
        <div>
          <span className="muted small">multiply-adds, forward</span>
          <strong>{(n * inp * out).toLocaleString()}</strong>
        </div>
        <div>
          <span className="muted small">multiply-adds, backward</span>
          <strong>{(2 * n * inp * out).toLocaleString()}</strong>
        </div>
      </div>
    </Figure>
  );
}
