import { useId, useState } from "react";
import { Icon } from "../components/Icon";
import { Tex } from "../components/RichText";
import { ArrowDefs, Figure, Slider, fmt } from "./common";

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

interface NodeSpec {
  id: string;
  x: number;
  y: number;
  title: string;
  input?: boolean;
}

const NODES: NodeSpec[] = [
  { id: "x", x: 70, y: 70, title: "x", input: true },
  { id: "w", x: 70, y: 190, title: "w", input: true },
  { id: "z1", x: 235, y: 130, title: "w·x" },
  { id: "b", x: 235, y: 260, title: "b", input: true },
  { id: "z", x: 400, y: 195, title: "z = w·x + b" },
  { id: "y", x: 555, y: 195, title: "y = σ(z)" },
  { id: "t", x: 555, y: 70, title: "target t", input: true },
  { id: "L", x: 700, y: 130, title: "L = (y − t)²" },
];

const EDGES: [string, string][] = [
  ["x", "z1"],
  ["w", "z1"],
  ["z1", "z"],
  ["b", "z"],
  ["z", "y"],
  ["y", "L"],
  ["t", "L"],
];

// Which gradients are visible after each backward step.
const REVEAL: string[][] = [[], ["L"], ["L", "y"], ["L", "y", "z"], ["L", "y", "z", "z1", "b"], ["L", "y", "z", "z1", "b", "w", "x"]];
// Which edges carry the gradient in each step.
const ACTIVE: string[][] = [[], [], ["y-L"], ["z-y"], ["z1-z", "b-z"], ["x-z1", "w-z1"]];

const NW = 112;
const NH = 44;

export function ChainRuleGraph() {
  const id = useId().replace(/:/g, "");
  const [x, setX] = useState(1.5);
  const [w, setW] = useState(-0.4);
  const [b, setB] = useState(0.2);
  const [t, setT] = useState(1);
  const [step, setStep] = useState(0);

  // forward
  const z1 = w * x;
  const z = z1 + b;
  const y = sigmoid(z);
  const L = (y - t) ** 2;
  // backward
  const dL = 1;
  const dy = 2 * (y - t);
  const sp = y * (1 - y);
  const dz = dy * sp;
  const dz1 = dz;
  const db = dz;
  const dw = dz1 * x;
  const dx = dz1 * w;

  const value: Record<string, number> = { x, w, z1, b, z, y, t, L };
  const grad: Record<string, number> = { L: dL, y: dy, z: dz, z1: dz1, b: db, w: dw, x: dx };
  const shown = new Set(REVEAL[step]);
  const active = new Set(ACTIVE[step]);
  const pos = Object.fromEntries(NODES.map((n) => [n.id, n]));

  // numerical check of dL/dw
  const lossAt = (ww: number) => (sigmoid(ww * x + b) - t) ** 2;
  const h = 1e-5;
  const numeric = (lossAt(w + h) - lossAt(w - h)) / (2 * h);

  const explain: string[] = [
    `\\text{Forward pass: } z = ${fmt(w)}\\cdot${fmt(x)} + ${fmt(b)} = ${fmt(z)},\\quad y = \\sigma(z) = ${fmt(y)},\\quad L = (${fmt(y)} - ${fmt(t)})^2 = ${fmt(L, 4)}`,
    `\\frac{\\partial L}{\\partial L} = 1 \\quad\\text{(start at the output)}`,
    `\\frac{\\partial L}{\\partial y} = 2(y - t) = 2(${fmt(y)} - ${fmt(t)}) = ${fmt(dy)}`,
    `\\frac{\\partial L}{\\partial z} = \\frac{\\partial L}{\\partial y}\\cdot\\frac{\\partial y}{\\partial z} = ${fmt(dy)} \\cdot \\sigma(z)(1-\\sigma(z)) = ${fmt(dy)}\\cdot${fmt(sp)} = ${fmt(dz, 4)}`,
    `\\frac{\\partial L}{\\partial (wx)} = \\frac{\\partial L}{\\partial z}\\cdot 1 = ${fmt(dz1, 4)},\\qquad \\frac{\\partial L}{\\partial b} = \\frac{\\partial L}{\\partial z}\\cdot 1 = ${fmt(db, 4)}`,
    `\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial (wx)}\\cdot x = ${fmt(dz1, 4)}\\cdot${fmt(x)} = ${fmt(dw, 4)},\\qquad \\frac{\\partial L}{\\partial x} = \\frac{\\partial L}{\\partial (wx)}\\cdot w = ${fmt(dx, 4)}`,
  ];
  const localLabel: Record<string, string> = {
    "y-L": `×2(y−t)`,
    "z-y": `×σ′(z)`,
    "z1-z": "×1",
    "b-z": "×1",
    "x-z1": "×w",
    "w-z1": "×x",
  };

  return (
    <Figure
      title="Backpropagation through one neuron"
      caption="Values flow forward (left to right). Gradients flow backward: each node multiplies the gradient arriving from its right by its own local derivative. That's the chain rule, one step at a time."
      controls={
        <>
          <Slider label="x" value={x} min={-3} max={3} step={0.1} onChange={setX} width={120} />
          <Slider label="w" value={w} min={-3} max={3} step={0.1} onChange={setW} width={120} />
          <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={setB} width={120} />
          <Slider label="t" value={t} min={0} max={1} step={0.05} onChange={setT} width={120} />
        </>
      }
    >
      <svg viewBox="0 0 770 320" className="viz-svg wide-plot" role="img" aria-label="Computational graph">
        <ArrowDefs id={id} colors={["viz-axis", "viz-d"]} />
        {EDGES.map(([from, to]) => {
          const a = pos[from];
          const c = pos[to];
          const key = `${from}-${to}`;
          const on = active.has(key);
          const x1 = a.x + NW / 2;
          const x2 = c.x - NW / 2 - 4;
          const mx = (x1 + x2) / 2;
          const my = (a.y + c.y) / 2;
          return (
            <g key={key}>
              <line
                x1={x1}
                y1={a.y}
                x2={x2}
                y2={c.y}
                className={`cg-edge ${on ? "on" : ""}`}
                markerEnd={`url(#${id}-${on ? "viz-d" : "viz-axis"})`}
              />
              {on && (
                <text x={mx} y={my - 8} textAnchor="middle" className="cg-local">
                  {localLabel[key]}
                </text>
              )}
            </g>
          );
        })}
        {NODES.map((n) => (
          <g key={n.id} transform={`translate(${n.x - NW / 2}, ${n.y - NH / 2})`}>
            <rect width={NW} height={NH} rx={9} className={`cg-node ${n.input ? "cg-input" : ""} ${shown.has(n.id) ? "has-grad" : ""}`} />
            <text x={NW / 2} y={17} textAnchor="middle" className="cg-title">
              {n.title}
            </text>
            <text x={NW / 2} y={34} textAnchor="middle" className="cg-value">
              {fmt(value[n.id], 3)}
            </text>
            {shown.has(n.id) && (
              <g transform={`translate(${NW / 2}, ${NH + 14})`}>
                <rect x={-50} y={-11} width={100} height={20} rx={10} className="cg-grad-pill" />
                <text textAnchor="middle" y={4} className="cg-grad">
                  ∂L/∂{n.id === "z1" ? "(wx)" : n.id} = {fmt(grad[n.id], 3)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      <div className="cg-explain">
        <Tex>{explain[step]}</Tex>
        {step === 5 && (
          <div className="small muted cg-check">
            Numerical check:{" "}
            <Tex>{`\\frac{L(w+h) - L(w-h)}{2h} = ${fmt(numeric, 4)}`}</Tex> ✓ matches{" "}
            <Tex>{`\\partial L/\\partial w`}</Tex>
          </div>
        )}
      </div>

      <div className="preset-row cg-controls">
        <button className="btn btn-sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <Icon name="chevronLeft" size={14} /> Back
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => setStep(Math.min(5, step + 1))} disabled={step === 5}>
          {step === 0 ? "Start backward pass" : "Next step"} <Icon name="chevronRight" size={14} />
        </button>
        <button className="btn btn-sm" onClick={() => setStep(0)}>
          <Icon name="reset" size={14} /> Reset
        </button>
        <span className="small muted">Step {step} of 5</span>
      </div>
    </Figure>
  );
}
