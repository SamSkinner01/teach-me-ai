import { useState } from "react";
import { Tex } from "../components/RichText";
import { Figure, Slider, fmt } from "./common";
import { softmax } from "./random";

const CLASSES = ["cat", "dog", "bird", "fish"];
const START = [2, 1, 0.1, -1];

export function SoftmaxViz() {
  const [z, setZ] = useState<number[]>(START);
  const [temp, setTemp] = useState(1);

  const p = softmax(z, temp);
  const exps = z.map((v) => Math.exp(v / temp));
  const maxExp = Math.max(...exps);
  const best = p.indexOf(Math.max(...p));
  const shift = (d: number) => setZ(z.map((v) => Math.max(-8, Math.min(8, Number((v + d).toFixed(2))))));

  return (
    <Figure
      title="Softmax turns scores into probabilities"
      caption="Drag the scores (logits). Softmax exponentiates each one, which makes it positive, and divides by the total, which makes them sum to 1. Adding the same number to every score changes nothing. Temperature divides the scores first: low temperature sharpens the distribution, high temperature flattens it."
      controls={
        <>
          <Slider label="temperature T" value={temp} min={0.1} max={5} step={0.05} onChange={setTemp} format={(v) => fmt(v, 2)} />
          <div className="preset-row">
            <button className="btn btn-sm" onClick={() => shift(1)}>
              Add 1 to every score
            </button>
            <button className="btn btn-sm" onClick={() => shift(-1)}>
              Subtract 1
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setZ(START);
                setTemp(1);
              }}
            >
              Reset
            </button>
          </div>
        </>
      }
    >
      <div className="sm-table" role="table" aria-label="Softmax computation">
        <div className="sm-row sm-head" role="row">
          <span role="columnheader">class</span>
          <span role="columnheader">score z</span>
          <span role="columnheader">
            <Tex>{"e^{z/T}"}</Tex>
          </span>
          <span role="columnheader">probability</span>
        </div>
        {CLASSES.map((c, i) => (
          <div key={c} className={`sm-row ${i === best ? "best" : ""}`} role="row">
            <span className="sm-class" role="cell">
              {c}
            </span>
            <span role="cell" className="sm-logit">
              <input
                type="range"
                min={-8}
                max={8}
                step={0.1}
                value={z[i]}
                aria-label={`score for ${c}`}
                onChange={(e) => setZ(z.map((v, j) => (j === i ? Number(e.target.value) : v)))}
              />
              <span className="mono">{fmt(z[i], 1)}</span>
            </span>
            <span role="cell" className="sm-bar-cell">
              <span className="sm-bar exp" style={{ width: `${(exps[i] / maxExp) * 100}%` }} />
              <span className="mono small">{exps[i] >= 1000 ? exps[i].toExponential(1) : fmt(exps[i], 2)}</span>
            </span>
            <span role="cell" className="sm-bar-cell">
              <span className="sm-bar prob" style={{ width: `${p[i] * 100}%` }} />
              <span className="mono small">{(p[i] * 100).toFixed(1)}%</span>
            </span>
          </div>
        ))}
        <div className="sm-row sm-foot" role="row">
          <span role="cell" />
          <span role="cell" />
          <span role="cell" className="mono small">
            Σ = {(() => {
              const s = exps.reduce((a, b) => a + b, 0);
              return s >= 1000 ? s.toExponential(2) : fmt(s, 2);
            })()}
          </span>
          <span role="cell" className="mono small">
            Σ = {fmt(p.reduce((a, b) => a + b, 0), 3)}
          </span>
        </div>
      </div>
      <div className="mm-calc">
        <Tex>{`p_{\\text{${CLASSES[best]}}} = \\frac{e^{${fmt(z[best], 1)}/${fmt(temp, 2)}}}{\\sum_j e^{z_j/${fmt(temp, 2)}}} = ${fmt(p[best], 3)}`}</Tex>
      </div>
    </Figure>
  );
}
