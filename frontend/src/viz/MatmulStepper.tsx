import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Figure, fmt } from "./common";

type Mat = number[][];

function randomMatrix(rows: number, cols: number): Mat {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(Math.random() * 9) - 3));
}

function multiply(a: Mat, b: Mat): Mat {
  return a.map((row) => b[0].map((_, j) => row.reduce((s, x, t) => s + x * b[t][j], 0)));
}

const START_A: Mat = [
  [1, 2, 3],
  [4, 5, 6],
];
const START_B: Mat = [
  [7, 8],
  [9, 10],
  [11, 12],
];

function MatrixGrid({
  m,
  label,
  hiRow,
  hiCol,
  shown,
  current,
}: {
  m: (number | null)[][];
  label: string;
  hiRow?: number;
  hiCol?: number;
  shown?: (i: number, j: number) => boolean;
  current?: [number, number] | null;
}) {
  const cols = m[0]?.length ?? 0;
  return (
    <div className="mm-block">
      <div className="mm-label">
        {label} <span className="muted">
          {m.length}×{cols}
        </span>
      </div>
      <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.6em, auto))` }}>
        {m.map((row, i) =>
          row.map((x, j) => {
            const cls = [
              "mm-cell",
              hiRow === i ? "row-hi" : "",
              hiCol === j ? "col-hi" : "",
              current && current[0] === i && current[1] === j ? "current" : "",
            ].join(" ");
            const visible = shown ? shown(i, j) : true;
            return (
              <span key={`${i}-${j}`} className={cls}>
                {visible && x !== null ? fmt(x) : ""}
              </span>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function MatmulStepper() {
  const [a, setA] = useState<Mat>(START_A);
  const [b, setB] = useState<Mat>(START_B);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const n = a.length;
  const m = b[0].length;
  const k = b.length;
  const total = n * m;
  const c = multiply(a, b);
  const cur: [number, number] | null = step > 0 ? [Math.floor((step - 1) / m), (step - 1) % m] : null;

  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setStep((s) => s + 1), 900);
    return () => window.clearTimeout(t);
  }, [playing, step, total]);

  function shuffle() {
    const dims = () => 1 + Math.floor(Math.random() * 3);
    let rows = dims();
    let inner = dims();
    let cols = dims();
    if (rows * inner * cols === 1) [rows, inner, cols] = [2, 2, 2];
    setA(randomMatrix(rows, inner));
    setB(randomMatrix(inner, cols));
    setStep(0);
    setPlaying(false);
  }

  const terms = cur ? a[cur[0]].map((x, t) => ({ x, y: b[t][cur[1]] })) : [];

  return (
    <Figure
      title="Row × column, one cell at a time"
      caption="Each entry of the result is the dot product of a row of A with a column of B. Step through the cells, or shuffle to get new matrices (and new shapes)."
      controls={
        <div className="preset-row">
          <button className="btn btn-sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <Icon name="chevronLeft" size={14} /> Back
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setStep(Math.min(total, step + 1))} disabled={step >= total}>
            Next cell <Icon name="chevronRight" size={14} />
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              if (step >= total) setStep(0);
              setPlaying(!playing);
            }}
          >
            <Icon name={playing ? "clock" : "play"} size={14} /> {playing ? "Pause" : "Play"}
          </button>
          <button className="btn btn-sm" onClick={() => setStep(0)}>
            <Icon name="reset" size={14} /> Reset
          </button>
          <button className="btn btn-sm" onClick={shuffle}>
            <Icon name="sparkle" size={14} /> Shuffle
          </button>
        </div>
      }
    >
      <div className="mm-row">
        <MatrixGrid m={a} label="A" hiRow={cur?.[0]} />
        <span className="mm-op">×</span>
        <MatrixGrid m={b} label="B" hiCol={cur?.[1]} />
        <span className="mm-op">=</span>
        <MatrixGrid m={c} label="C" shown={(i, j) => i * m + j < step} current={cur} />
      </div>
      <div className="mm-shape small muted">
        ({n}×{k}) × ({k}×{m}) → {n}×{m}: the inner sizes ({k} and {k}) must match, and the outer ones give the result's
        shape.
      </div>
      <div className="mm-calc" aria-live="polite">
        {cur ? (
          <>
            <span className="mono">
              C[{cur[0]}][{cur[1]}] =
            </span>{" "}
            {terms.map((t, i) => (
              <span key={i}>
                {i > 0 && " + "}
                <span className="mm-term">
                  <span className="row-text">{fmt(t.x)}</span>·<span className="col-text">{fmt(t.y)}</span>
                </span>
              </span>
            ))}{" "}
            = <strong>{fmt(c[cur[0]][cur[1]])}</strong>
          </>
        ) : (
          <span className="muted">Press “Next cell” to compute C[0][0].</span>
        )}
      </div>
    </Figure>
  );
}
