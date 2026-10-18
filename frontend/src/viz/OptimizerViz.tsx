import { useId, useState } from "react";
import { Tex } from "../components/RichText";
import { Arrow, ArrowDefs, Figure, Slider, fmt, linear } from "./common";
import { ContourCanvas } from "./contour";

const PRESETS = [
  { lr: 0.05, label: "too small" },
  { lr: 0.3, label: "about right" },
  { lr: 0.85, label: "too big" },
  { lr: 1.04, label: "way too big" },
];

/** Gradient descent on f(x) = x² with a chosen learning rate. */
export function LearningRateViz() {
  const id = useId().replace(/:/g, "");
  const [lr, setLr] = useState(0.3);
  const [steps, setSteps] = useState(10);
  const W = 560;
  const H = 280;
  const sx = linear(-3.2, 3.2, 20, W - 20);
  const sy = linear(0, 10.5, H - 20, 14);

  const xs = [2.5];
  for (let i = 0; i < steps; i++) xs.push(xs[i] - lr * 2 * xs[i]);
  const factor = 1 - 2 * lr;
  const diverged = Math.abs(xs[xs.length - 1]) > 3.2;
  const curve: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const x = -3.2 + (6.4 * i) / 160;
    curve.push(`${sx(x).toFixed(1)},${sy(x * x).toFixed(1)}`);
  }
  const shown = xs.filter((x) => Math.abs(x) <= 3.2);

  let verdict: string;
  if (lr < 0.5) verdict = lr < 0.15 ? "Converging, but slowly: each step only shrinks x a little." : "Converging quickly, straight down one side.";
  else if (lr === 0.5) verdict = "Exactly 1/2: it jumps straight to the minimum in one step (only for this perfect parabola).";
  else if (lr < 1) verdict = "Overshooting: each step jumps past the minimum to the other side, but the jumps shrink, so it still converges.";
  else if (lr === 1) verdict = "Stuck bouncing between +2.5 and −2.5 forever.";
  else verdict = "Diverging: every jump overshoots by more than the last. The loss explodes.";

  return (
    <Figure
      title="The learning rate decides everything"
      caption="Gradient descent on f(x) = x², starting at x = 2.5. The gradient is 2x, so each step is x ← x − η·2x = (1 − 2η)·x. Whether that factor is between 0 and 1, between −1 and 0, or beyond −1 decides whether training crawls, zig-zags or explodes."
      controls={
        <>
          <Slider label={<Tex>{"\\text{learning rate } \\eta"}</Tex>} value={lr} min={0.01} max={1.1} step={0.01} onChange={setLr} format={(v) => fmt(v, 2)} />
          <Slider label="steps" value={steps} min={1} max={30} step={1} onChange={setSteps} format={(v) => String(v)} width={130} />
          <div className="preset-row">
            {PRESETS.map((p) => (
              <button key={p.lr} className={`btn btn-sm ${lr === p.lr ? "btn-primary" : ""}`} onClick={() => setLr(p.lr)}>
                {p.label}
              </button>
            ))}
          </div>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg wide-plot" role="img" aria-label="Gradient descent steps on a parabola">
        <ArrowDefs id={id} colors={["viz-b"]} />
        <line x1={20} x2={W - 20} y1={sy(0)} y2={sy(0)} className="viz-axisline" />
        <line x1={sx(0)} x2={sx(0)} y1={14} y2={sy(0)} className="viz-axisline faint" />
        <path d={"M" + curve.join("L")} className="viz-curve" />
        {shown.slice(0, -1).map((x, i) => {
          const n = shown[i + 1];
          return <Arrow key={i} x1={sx(x)} y1={sy(x * x)} x2={sx(n)} y2={sy(n * n)} color="viz-b" markerId={id} width={1.8} opacity={0.85} />;
        })}
        {shown.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(x * x)} r={i === 0 ? 6 : 3.5} className={i === 0 ? "viz-point" : "lr-dot"} />
        ))}
        {diverged && (
          <text x={W / 2} y={30} textAnchor="middle" className="lr-warning">
            diverged off the chart
          </text>
        )}
      </svg>
      <div className="readout-strip">
        <div>
          <span className="muted small">each step multiplies x by</span>
          <Tex>{`1 - 2\\eta = ${fmt(factor, 2)}`}</Tex>
        </div>
        <div>
          <span className="muted small">after {steps} steps</span>
          <Tex>{`x = ${Math.abs(xs[steps]) > 1e6 ? xs[steps].toExponential(2).replace("e", "\\times10^{") + "}" : fmt(xs[steps], 4)}`}</Tex>
        </div>
        <div className="lr-verdict">
          <span className="muted small">verdict</span>
          <span>{verdict}</span>
        </div>
      </div>
    </Figure>
  );
}

const valley = (x: number, y: number) => 0.1 * x * x + 2 * y * y;
const R = 6;

function runPaths(lr: number, beta: number, steps: number) {
  const gd: [number, number][] = [[-5, 2]];
  const mom: [number, number][] = [[-5, 2]];
  let v: [number, number] = [0, 0];
  for (let i = 0; i < steps; i++) {
    const [x, y] = gd[i];
    gd.push([x - lr * 0.2 * x, y - lr * 4 * y]);
    const [mx, my] = mom[i];
    v = [beta * v[0] + 0.2 * mx, beta * v[1] + 4 * my];
    mom.push([mx - lr * v[0], my - lr * v[1]]);
  }
  return { gd, mom };
}

/** Plain gradient descent vs. momentum on a long, narrow valley. */
export function MomentumViz() {
  // Defaults chosen by simulation: plain GD visibly crawls, momentum gets ~1000× lower.
  const [lr, setLr] = useState(0.1);
  const [beta, setBeta] = useState(0.75);
  const [steps, setSteps] = useState(40);
  const { gd, mom } = runPaths(lr, beta, steps);
  const S = 360;
  const sx = linear(-R, R, 0, S);
  const sy = linear(-R, R, S, 0);
  const inView = (p: [number, number]) => Math.abs(p[0]) <= R && Math.abs(p[1]) <= R;
  const pts = (ps: [number, number][]) => ps.filter(inView).map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
  const fg = valley(...gd[steps]);
  const fm = valley(...mom[steps]);

  return (
    <Figure
      title="Momentum in a narrow valley"
      caption="f(x, y) = 0.1x² + 2y²: steep across (y), shallow along (x). Plain gradient descent (orange) must keep its learning rate small enough not to blow up across the valley, so it crawls along it. Momentum (green) builds up speed in the consistent direction, while the back-and-forth across the valley cancels out. Push β towards 1 and it overshoots: too much momentum swings back and forth before settling."
      controls={
        <>
          <Slider label={<Tex>{"\\eta"}</Tex>} value={lr} min={0.01} max={0.45} step={0.01} onChange={setLr} format={(v) => fmt(v, 2)} width={140} />
          <Slider label={<Tex>{"\\beta"}</Tex>} value={beta} min={0} max={0.98} step={0.01} onChange={setBeta} format={(v) => fmt(v, 2)} width={140} />
          <Slider label="steps" value={steps} min={1} max={120} step={1} onChange={setSteps} format={(v) => String(v)} width={140} />
        </>
      }
    >
      <div className="viz-split">
        <div className="gf-stage">
          <ContourCanvas f={valley} x0={-R} x1={R} y0={-R} y1={R} res={180} levels={18} />
          <svg viewBox={`0 0 ${S} ${S}`} className="viz-svg square gf-overlay" role="img" aria-label="Optimizer paths">
            <polyline points={pts(gd)} className="path-gd" />
            <polyline points={pts(mom)} className="path-mom" />
            <circle cx={sx(-5)} cy={sy(2)} r={6} className="viz-point" />
            <circle cx={sx(0)} cy={sy(0)} r={4} className="path-goal" />
            {inView(gd[steps]) && <circle cx={sx(gd[steps][0])} cy={sy(gd[steps][1])} r={5} className="path-end-gd" />}
            {inView(mom[steps]) && <circle cx={sx(mom[steps][0])} cy={sy(mom[steps][1])} r={5} className="path-end-mom" />}
          </svg>
        </div>
        <div className="viz-readout">
          <div className="readout-row">
            <span className="swatch" style={{ background: "var(--viz-b)" }} /> plain GD: <Tex>{`f = ${fmt(fg, 4)}`}</Tex>
          </div>
          <div className="readout-row">
            <span className="swatch" style={{ background: "var(--viz-c)" }} /> momentum: <Tex>{`f = ${fmt(fm, 4)}`}</Tex>
          </div>
          <div className="readout-row">
            <Tex>{`v \\leftarrow \\beta v + \\nabla f, \\qquad x \\leftarrow x - \\eta\\, v`}</Tex>
          </div>
          <div className="readout-note">
            {lr > 0.5 - 1e-9
              ? "Above η = 0.5, plain gradient descent diverges across the valley."
              : fm < fg
                ? `After ${steps} steps momentum's loss is ${fg / Math.max(fm, 1e-12) >= 100 ? "over 100" : fmt(fg / Math.max(fm, 1e-12), 1)}× lower.`
                : "With these settings momentum overshoots. Try a smaller β or η."}
          </div>
        </div>
      </div>
    </Figure>
  );
}
