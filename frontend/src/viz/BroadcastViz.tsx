import { useState } from "react";
import { Figure, fmt } from "./common";

const M = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
];
const B = [10, 20, 30];

export function BroadcastViz() {
  const [stretched, setStretched] = useState(false);
  const [hover, setHover] = useState<[number, number] | null>(null);

  return (
    <Figure
      title="Broadcasting a bias vector"
      caption="b has one row but m has four. Broadcasting stretches b down every row, without copying it in memory, so each row gets the same bias."
      controls={
        <button className="btn btn-sm btn-primary" onClick={() => setStretched(!stretched)}>
          {stretched ? "Collapse b" : "Stretch b to fit"}
        </button>
      }
    >
      <div className="mm-row bc-row">
        <div className="mm-block">
          <div className="mm-label">
            m <span className="muted">4×3</span>
          </div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(3, 2.6em)" }}>
            {M.map((row, i) =>
              row.map((x, j) => (
                <span key={`${i}-${j}`} className={`mm-cell ${hover && hover[0] === i && hover[1] === j ? "row-hi" : ""}`}>
                  {x}
                </span>
              )),
            )}
          </div>
        </div>
        <span className="mm-op">+</span>
        <div className="mm-block">
          <div className="mm-label">
            b <span className="muted">{stretched ? "1×3 → 4×3" : "1×3"}</span>
          </div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(3, 2.6em)" }}>
            {(stretched ? M : [B]).map((_, i) =>
              B.map((x, j) => (
                <span
                  key={`${i}-${j}`}
                  className={`mm-cell ${i > 0 ? "ghost" : ""} ${hover && hover[1] === j && (stretched ? hover[0] === i : true) ? "col-hi" : ""}`}
                >
                  {x}
                </span>
              )),
            )}
          </div>
        </div>
        <span className="mm-op">=</span>
        <div className="mm-block">
          <div className="mm-label">
            result <span className="muted">4×3</span>
          </div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(3, 2.6em)" }}>
            {M.map((row, i) =>
              row.map((x, j) => (
                <button
                  key={`${i}-${j}`}
                  className={`mm-cell interactive ${hover && hover[0] === i && hover[1] === j ? "current" : ""}`}
                  onMouseEnter={() => setHover([i, j])}
                  onFocus={() => setHover([i, j])}
                  onMouseLeave={() => setHover(null)}
                >
                  {x + B[j]}
                </button>
              )),
            )}
          </div>
        </div>
      </div>
      <div className="mm-calc">
        {hover ? (
          <span className="mono">
            result[{hover[0]}][{hover[1]}] = m[{hover[0]}][{hover[1]}] + b[{hover[1]}] = {fmt(M[hover[0]][hover[1]])} +{" "}
            {fmt(B[hover[1]])} = {fmt(M[hover[0]][hover[1]] + B[hover[1]])}
          </span>
        ) : (
          <span className="muted">Hover a cell of the result.</span>
        )}
      </div>
    </Figure>
  );
}
