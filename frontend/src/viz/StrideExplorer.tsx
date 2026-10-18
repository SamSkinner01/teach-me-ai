import { useState } from "react";
import { Tex } from "../components/RichText";
import { Figure } from "./common";

const PRESETS: number[][] = [[6], [2, 3], [3, 4], [2, 3, 4], [3, 2, 2]];

function stridesOf(shape: number[]): number[] {
  const s = new Array(shape.length).fill(0);
  let step = 1;
  for (let i = shape.length - 1; i >= 0; i--) {
    s[i] = step;
    step *= shape[i];
  }
  return s;
}

function unravel(flat: number, shape: number[]): number[] {
  const idx = new Array(shape.length).fill(0);
  for (let i = shape.length - 1; i >= 0; i--) {
    idx[i] = flat % shape[i];
    flat = Math.floor(flat / shape[i]);
  }
  return idx;
}

export function StrideExplorer() {
  const [shape, setShape] = useState<number[]>([2, 3, 4]);
  const [hover, setHover] = useState<number | null>(23);

  const strides = stridesOf(shape);
  const size = shape.reduce((p, x) => p * x, 1);
  const idx = hover !== null ? unravel(hover, shape) : null;

  function setDim(i: number, delta: number) {
    const next = [...shape];
    next[i] = Math.min(5, Math.max(1, next[i] + delta));
    setShape(next);
    setHover(null);
  }

  // Lay the tensor out as 2-D blocks: leading axes pick the block, last two axes are rows/cols.
  const rows = shape.length >= 2 ? shape[shape.length - 2] : 1;
  const cols = shape[shape.length - 1];
  const blocks = shape.length === 3 ? shape[0] : 1;

  const cell = (flat: number) => {
    const isHover = flat === hover;
    const multi = unravel(flat, shape);
    return (
      <button
        key={flat}
        className={`se-cell ${isHover ? "hi" : ""}`}
        onMouseEnter={() => setHover(flat)}
        onFocus={() => setHover(flat)}
        onClick={() => setHover(flat)}
        aria-label={`element [${multi.join(", ")}] stored at position ${flat}`}
      >
        {flat}
      </button>
    );
  };

  return (
    <Figure
      title="One flat block of memory, many shapes"
      caption="The numbers are each element's position in memory. Hover any element, in the tensor or in the memory strip, to see how its index turns into that position."
      controls={
        <div className="preset-row">
          {PRESETS.map((p) => (
            <button
              key={p.join("x")}
              className={`btn btn-sm ${p.join() === shape.join() ? "btn-primary" : ""}`}
              onClick={() => {
                setShape(p);
                setHover(null);
              }}
            >
              [{p.join(", ")}]
            </button>
          ))}
        </div>
      }
    >
      <div className="se-shape">
        <span className="muted small">shape</span>
        {shape.map((d, i) => (
          <span key={i} className="se-dim">
            <button className="btn btn-sm btn-ghost" onClick={() => setDim(i, -1)} aria-label={`Shrink axis ${i}`}>
              −
            </button>
            <span className="mono">{d}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setDim(i, 1)} aria-label={`Grow axis ${i}`}>
              +
            </button>
          </span>
        ))}
        <span className="muted small">strides</span>
        <span className="mono se-strides">[{strides.join(", ")}]</span>
      </div>

      <div className="se-tensor">
        {Array.from({ length: blocks }, (_, b) => (
          <div key={b} className="se-block">
            {shape.length === 3 && <div className="se-block-label mono">[{b}, :, :]</div>}
            <div className="se-grid" style={{ gridTemplateColumns: `repeat(${cols}, 2.4em)` }}>
              {Array.from({ length: rows * cols }, (_, i) => cell(b * rows * cols + i))}
            </div>
          </div>
        ))}
      </div>

      <div className="se-memory-label small muted">memory (row-major)</div>
      <div className="se-memory">
        {Array.from({ length: size }, (_, flat) => (
          <span
            key={flat}
            className={`se-mem ${flat === hover ? "hi" : ""}`}
            onMouseEnter={() => setHover(flat)}
          >
            {flat}
          </span>
        ))}
      </div>

      <div className="se-calc" aria-live="polite">
        {idx ? (
          <Tex>{`\\text{index } (${idx.join(", ")}) \\;\\to\\; ${idx.map((x, i) => `${x}\\cdot${strides[i]}`).join(" + ")} = ${hover}`}</Tex>
        ) : (
          <span className="muted">Hover an element.</span>
        )}
      </div>
    </Figure>
  );
}
