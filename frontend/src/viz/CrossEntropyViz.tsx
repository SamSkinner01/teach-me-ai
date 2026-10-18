import { useCallback, useState } from "react";
import { Icon } from "../components/Icon";
import { Tex } from "../components/RichText";
import { Figure, Segmented, clamp, fmt, linear, useSvgDrag } from "./common";
import { softmax } from "./random";

const W = 520;
const H = 260;
const PAD = 34;

/** The −ln(p) curve: how the loss punishes low probability on the right answer. */
export function LogLossCurve() {
  const [p, setP] = useState(0.5);
  const sx = linear(0, 1, PAD, W - 12);
  const sy = linear(0, 5, H - PAD, 12);
  const drag = useSvgDrag(useCallback((px: number) => setP(clamp(sx.invert(px), 0.005, 1)), [sx]));
  const pts: string[] = [];
  for (let i = 1; i <= 200; i++) {
    const q = i / 200;
    pts.push(`${sx(q).toFixed(1)},${sy(Math.min(5, -Math.log(q))).toFixed(1)}`);
  }
  const loss = -Math.log(p);
  const marks = [0.01, 0.1, 0.5, 0.9];
  return (
    <Figure
      title="The loss for one example: −ln p"
      caption="Drag along the curve. p is the probability the model gave to the correct answer. Near p = 1 the loss is almost 0. As p heads towards 0 the loss shoots up: being confidently wrong is punished far more than being unsure."
    >
      <div className="viz-split">
        <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Plot of minus log p" {...drag}>
          <line x1={PAD} x2={W - 12} y1={sy(0)} y2={sy(0)} className="viz-axisline" />
          <line x1={PAD} x2={PAD} y1={12} y2={sy(0)} className="viz-axisline" />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <text key={t} x={sx(t)} y={H - 14} textAnchor="middle" className="tick">
              {t}
            </text>
          ))}
          {[1, 2, 3, 4, 5].map((t) => (
            <text key={t} x={PAD - 6} y={sy(t) + 4} textAnchor="end" className="tick">
              {t}
            </text>
          ))}
          <text x={W - 12} y={H - 1} textAnchor="end" className="tick">
            p (probability of the correct class)
          </text>
          <path d={"M" + pts.join("L")} className="viz-curve" />
          {marks.map((m) => (
            <circle key={m} cx={sx(m)} cy={sy(Math.min(5, -Math.log(m)))} r={3} className="ce-mark" />
          ))}
          <line x1={sx(p)} x2={sx(p)} y1={sy(0)} y2={sy(Math.min(5, loss))} className="viz-dashed" style={{ stroke: "var(--viz-b)" }} />
          <circle cx={sx(p)} cy={sy(Math.min(5, loss))} r={7} className="viz-point" />
        </svg>
        <div className="viz-readout">
          <div className="readout-big">
            <Tex>{`-\\ln(${fmt(p, 3)}) = ${fmt(loss, 3)}`}</Tex>
          </div>
          <table className="ce-table">
            <tbody>
              {marks.map((m) => (
                <tr key={m}>
                  <td>
                    <Tex>{`p = ${m}`}</Tex>
                  </td>
                  <td>
                    <Tex>{`\\text{loss} = ${fmt(-Math.log(m), 3)}`}</Tex>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="readout-note">
            A model that just guesses uniformly among 10 digits has p = 0.1 for every image, a loss of ln 10 ≈ 2.303. A
            freshly initialized network starts close to that.
          </div>
        </div>
      </div>
    </Figure>
  );
}

const CLASSES = ["cat", "dog", "bird"];
const START = [0.5, 1.5, -0.5];

/** Softmax + cross-entropy on three scores, with gradient-descent steps on the scores themselves. */
export function CrossEntropyTrainer() {
  const [z, setZ] = useState<number[]>(START);
  const [label, setLabel] = useState(0);
  const [rate, setRate] = useState(1);
  const [losses, setLosses] = useState<number[]>([]);

  const p = softmax(z);
  const loss = -Math.log(p[label]);
  const grad = p.map((v, i) => v - (i === label ? 1 : 0));

  function step() {
    setLosses((l) => [...l, loss].slice(-40));
    setZ(z.map((v, i) => v - rate * grad[i]));
  }

  function reset(nextLabel = label) {
    setZ(START);
    setLosses([]);
    setLabel(nextLabel);
  }

  const gmax = 1;
  const SW = 220;
  const SH = 60;
  const allLosses = [...losses, loss];
  const lx = linear(0, Math.max(1, allLosses.length - 1), 4, SW - 4);
  const ly = linear(0, Math.max(...allLosses, 0.5), SH - 6, 6);

  return (
    <Figure
      title="One training example, step by step"
      caption="Pick the correct class, then take gradient steps. The gradient of the loss with respect to each score is p − y: the correct class's score is pushed up by (1 − p), every other score is pushed down by its own probability. The loss falls fastest when the model is most wrong."
      controls={
        <>
          <span className="small muted">correct class:</span>
          <Segmented
            label="Correct class"
            value={String(label)}
            onChange={(v) => reset(Number(v))}
            options={CLASSES.map((c, i) => ({ value: String(i), label: c }))}
          />
          <Segmented
            label="Learning rate"
            value={String(rate)}
            onChange={(v) => setRate(Number(v))}
            options={[0.3, 1, 3].map((r) => ({ value: String(r), label: `η = ${r}` }))}
          />
        </>
      }
    >
      <div className="ce-grid" role="table" aria-label="Scores, probabilities and gradients">
        <div className="ce-row ce-head" role="row">
          <span role="columnheader">class</span>
          <span role="columnheader">score z</span>
          <span role="columnheader">probability p</span>
          <span role="columnheader">gradient p − y</span>
        </div>
        {CLASSES.map((c, i) => {
          const g = grad[i];
          const width = (Math.min(Math.abs(g), gmax) / gmax) * 50;
          return (
            <div key={c} className={`ce-row ${i === label ? "correct" : ""}`} role="row">
              <span role="cell" className="sm-class">
                {c} {i === label && <span className="badge badge-success">correct</span>}
              </span>
              <span role="cell" className="mono">
                {fmt(z[i], 2)}
              </span>
              <span role="cell" className="sm-bar-cell">
                <span className="sm-bar prob" style={{ width: `${p[i] * 100}%` }} />
                <span className="mono small">{(p[i] * 100).toFixed(1)}%</span>
              </span>
              <span role="cell" className="ce-grad-cell">
                <span className="ce-grad-track">
                  <span className="ce-zero" />
                  <span
                    className={`ce-grad-bar ${g < 0 ? "neg" : "pos"}`}
                    style={g < 0 ? { right: "50%", width: `${width}%` } : { left: "50%", width: `${width}%` }}
                  />
                </span>
                <span className="mono small">{fmt(g, 3)}</span>
                <span className="small muted ce-dir">{g < 0 ? "↑ score goes up" : g > 0 ? "↓ score goes down" : ""}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="ce-foot">
        <div>
          <Tex>{`L = -\\ln p_{\\text{${CLASSES[label]}}} = ${fmt(loss, 4)}`}</Tex>
        </div>
        <svg viewBox={`0 0 ${SW} ${SH}`} className="ce-spark" role="img" aria-label="Loss history">
          {allLosses.length > 1 && (
            <path d={"M" + allLosses.map((l, i) => `${lx(i).toFixed(1)},${ly(l).toFixed(1)}`).join("L")} className="running-path" />
          )}
          <circle cx={lx(allLosses.length - 1)} cy={ly(loss)} r={3} style={{ fill: "var(--viz-b)" }} />
        </svg>
        <div className="preset-row">
          <button className="btn btn-sm btn-primary" onClick={step}>
            <Icon name="arrowRight" size={14} /> Gradient step
          </button>
          <button className="btn btn-sm" onClick={() => reset()}>
            <Icon name="reset" size={14} /> Reset
          </button>
        </div>
      </div>
      <div className="small muted">
        <Tex>{`z \\leftarrow z - \\eta\\,(p - y)`}</Tex>. Notice the gradients always sum to zero.
      </div>
    </Figure>
  );
}
