import { useState } from "react";
import { Icon } from "../components/Icon";
import { Tex } from "../components/RichText";
import { Figure, Segmented, Slider, fmt } from "./common";

// ---------------------------------------------------------------------------
// Stride & padding
// ---------------------------------------------------------------------------

export function StridePaddingViz() {
  const [n, setN] = useState(5);
  const [k, setK] = useState(3);
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(0);
  const [step, setStep] = useState(0);

  const padded = n + 2 * pad;
  const fits = k <= padded;
  const out = fits ? Math.floor((padded - k) / stride) + 1 : 0;
  const total = out * out;
  const s = total ? step % total : 0;
  const oi = Math.floor(s / Math.max(out, 1));
  const oj = s % Math.max(out, 1);
  const top = oi * stride;
  const left = oj * stride;
  const covered = (r: number, c: number) => r >= top && r < top + k && c >= left && c < left + k;
  const unused = fits ? padded - ((out - 1) * stride + k) : 0;

  return (
    <Figure
      title="Stride and padding"
      caption="Padding surrounds the input with zeros (dashed cells) so the kernel can sit over the edges. Stride is how many cells the kernel jumps between positions. Step through the positions: every output cell (right) comes from one placement of the kernel (left)."
      controls={
        <>
          <Slider label="input size" value={n} min={3} max={8} step={1} onChange={(v) => { setN(v); setStep(0); }} format={String} width={120} />
          <Slider label="kernel" value={k} min={1} max={5} step={1} onChange={(v) => { setK(v); setStep(0); }} format={String} width={120} />
          <Slider label="stride" value={stride} min={1} max={3} step={1} onChange={(v) => { setStride(v); setStep(0); }} format={String} width={120} />
          <Slider label="padding" value={pad} min={0} max={2} step={1} onChange={(v) => { setPad(v); setStep(0); }} format={String} width={120} />
          <button className="btn btn-sm btn-primary" onClick={() => setStep(step + 1)} disabled={!total}>
            Next position <Icon name="chevronRight" size={14} />
          </button>
        </>
      }
    >
      <div className="sp-layout">
        <div className="sp-grid" style={{ gridTemplateColumns: `repeat(${padded}, 26px)` }} aria-label="Padded input">
          {Array.from({ length: padded * padded }, (_, idx) => {
            const r = Math.floor(idx / padded);
            const c = idx % padded;
            const isPad = r < pad || c < pad || r >= pad + n || c >= pad + n;
            return <span key={idx} className={`sp-cell ${isPad ? "pad" : ""} ${fits && covered(r, c) ? "hit" : ""}`} />;
          })}
        </div>
        <span className="mm-op">→</span>
        {fits ? (
          <div className="sp-grid" style={{ gridTemplateColumns: `repeat(${out}, 26px)` }} aria-label="Output">
            {Array.from({ length: total }, (_, idx) => (
              <span key={idx} className={`sp-cell out ${idx === s ? "hit" : idx < s ? "done" : ""}`} />
            ))}
          </div>
        ) : (
          <div className="alert alert-error">The kernel is bigger than the padded input.</div>
        )}
      </div>
      <div className="mm-calc">
        {fits ? (
          <Tex>{`\\text{output} = \\left\\lfloor \\frac{n + 2p - k}{s} \\right\\rfloor + 1 = \\left\\lfloor \\frac{${n} + ${2 * pad} - ${k}}{${stride}} \\right\\rfloor + 1 = ${out}`}</Tex>
        ) : (
          <span className="muted">No valid positions.</span>
        )}
        {fits && unused > 0 && <span className="small muted"> · the last {unused} row(s)/column(s) never get used</span>}
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// Pooling
// ---------------------------------------------------------------------------

const FMAP = [
  [1, 3, 2, 1, 0, 2],
  [4, 2, 0, 5, 1, 1],
  [7, 1, 3, 3, 2, 0],
  [0, 2, 8, 6, 1, 4],
  [2, 2, 1, 0, 3, 3],
  [1, 5, 2, 2, 0, 6],
];

export function PoolingViz() {
  const [mode, setMode] = useState<"max" | "avg">("max");
  const [view, setView] = useState<"forward" | "backward">("forward");
  const [hover, setHover] = useState<[number, number] | null>([1, 1]);
  const size = 2;
  const o = FMAP.length / size;
  const pooled = Array.from({ length: o }, (_, i) =>
    Array.from({ length: o }, (_, j) => {
      const vals = [0, 1].flatMap((u) => [0, 1].map((v) => FMAP[i * size + u][j * size + v]));
      return mode === "max" ? Math.max(...vals) : vals.reduce((a, b) => a + b, 0) / vals.length;
    }),
  );
  const argmax = (i: number, j: number): [number, number] => {
    let best: [number, number] = [i * size, j * size];
    for (let u = 0; u < size; u++)
      for (let v = 0; v < size; v++) if (FMAP[i * size + u][j * size + v] > FMAP[best[0]][best[1]]) best = [i * size + u, j * size + v];
    return best;
  };
  const inWindow = (r: number, c: number) => hover && Math.floor(r / size) === hover[0] && Math.floor(c / size) === hover[1];
  const gradAt = (r: number, c: number) => {
    const i = Math.floor(r / size);
    const j = Math.floor(c / size);
    if (mode === "avg") return 1 / (size * size);
    const [ar, ac] = argmax(i, j);
    return ar === r && ac === c ? 1 : 0;
  };

  return (
    <Figure
      title="Pooling a feature map"
      caption="2×2 pooling with stride 2 keeps one number per window: the maximum, or the average. Hover a pooled cell to see its window. Switch to “gradient” to see backpropagation: max pooling sends a window's whole gradient to the single position that won, while average pooling spreads it evenly."
      controls={
        <>
          <Segmented label="Pooling" value={mode} onChange={setMode} options={[{ value: "max", label: "max" }, { value: "avg", label: "average" }]} />
          <Segmented label="View" value={view} onChange={setView} options={[{ value: "forward", label: "values" }, { value: "backward", label: "gradient (each output gets 1)" }]} />
        </>
      }
    >
      <div className="mm-row">
        <div className="mm-block">
          <div className="mm-label">{view === "forward" ? "feature map 6×6" : "gradient on the feature map"}</div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(6, 2.6em)" }}>
            {FMAP.map((row, r) =>
              row.map((x, c) => {
                const g = gradAt(r, c);
                const win = inWindow(r, c);
                const isMax = hover && win && mode === "max" && argmax(hover[0], hover[1])[0] === r && argmax(hover[0], hover[1])[1] === c;
                return (
                  <span key={`${r}${c}`} className={`mm-cell ${win ? "row-hi" : ""} ${isMax ? "current" : ""} ${(Math.floor(r / 2) + Math.floor(c / 2)) % 2 ? "alt" : ""}`}>
                    {view === "forward" ? x : g === 0 ? "0" : fmt(g, 2)}
                  </span>
                );
              }),
            )}
          </div>
        </div>
        <span className="mm-op">{view === "forward" ? "→" : "←"}</span>
        <div className="mm-block">
          <div className="mm-label">{mode} pooled 3×3</div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(3, 2.6em)" }}>
            {pooled.map((row, i) =>
              row.map((x, j) => (
                <button
                  key={`${i}${j}`}
                  className={`mm-cell interactive ${hover && hover[0] === i && hover[1] === j ? "current" : ""}`}
                  onMouseEnter={() => setHover([i, j])}
                  onFocus={() => setHover([i, j])}
                >
                  {view === "forward" ? fmt(x, 2) : "1"}
                </button>
              )),
            )}
          </div>
        </div>
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// Where convolution gradients go
// ---------------------------------------------------------------------------

export function ConvGradViz() {
  const N = 5;
  const K = 3;
  const O = N - K + 1;
  const [sel, setSel] = useState<{ kind: "out" | "in"; i: number; j: number }>({ kind: "in", i: 2, j: 2 });
  const outsUsing = (r: number, c: number) => {
    const list: [number, number][] = [];
    for (let i = 0; i < O; i++) for (let j = 0; j < O; j++) if (r - i >= 0 && r - i < K && c - j >= 0 && c - j < K) list.push([i, j]);
    return list;
  };
  const inPatch = (r: number, c: number) => sel.kind === "out" && r >= sel.i && r < sel.i + K && c >= sel.j && c < sel.j + K;
  const users = sel.kind === "in" ? outsUsing(sel.i, sel.j) : [];
  const isUser = (i: number, j: number) => users.some(([a, b]) => a === i && b === j);
  const kernelLabel = (i: number, j: number) => `w${sel.i - i}${sel.j - j}`;

  return (
    <Figure
      title="Who depends on whom"
      caption="Click an output cell to see the 3×3 input patch it was computed from (the forward pass). Click an input pixel to see every output it contributed to, and through which kernel weight. That reversed relationship is the backward pass: an input pixel's gradient collects one term from each output it touched, which works out to a convolution with the kernel flipped."
    >
      <div className="mm-row">
        <div className="mm-block">
          <div className="mm-label">input 5×5 (click a pixel)</div>
          <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${N}, 2.6em)` }}>
            {Array.from({ length: N * N }, (_, idx) => {
              const r = Math.floor(idx / N);
              const c = idx % N;
              const chosen = sel.kind === "in" && sel.i === r && sel.j === c;
              return (
                <button key={idx} className={`mm-cell interactive ${chosen ? "current" : ""} ${inPatch(r, c) ? "row-hi" : ""}`} onClick={() => setSel({ kind: "in", i: r, j: c })} aria-label={`input pixel ${r}, ${c}`}>
                  x{r}{c}
                </button>
              );
            })}
          </div>
        </div>
        <span className="mm-op">⋆</span>
        <div className="mm-block">
          <div className="mm-label">kernel 3×3</div>
          <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${K}, 2.6em)` }}>
            {Array.from({ length: K * K }, (_, idx) => (
              <span key={idx} className="mm-cell">
                w{Math.floor(idx / K)}{idx % K}
              </span>
            ))}
          </div>
        </div>
        <span className="mm-op">=</span>
        <div className="mm-block">
          <div className="mm-label">output 3×3 (click a cell)</div>
          <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${O}, 3.4em)` }}>
            {Array.from({ length: O * O }, (_, idx) => {
              const i = Math.floor(idx / O);
              const j = idx % O;
              const chosen = sel.kind === "out" && sel.i === i && sel.j === j;
              return (
                <button key={idx} className={`mm-cell interactive ${chosen ? "current" : ""} ${isUser(i, j) ? "col-hi" : ""}`} onClick={() => setSel({ kind: "out", i, j })} aria-label={`output ${i}, ${j}`}>
                  {sel.kind === "in" && isUser(i, j) ? kernelLabel(i, j) : `y${i}${j}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mm-calc">
        {sel.kind === "out" ? (
          <Tex>{`y_{${sel.i}${sel.j}} = \\sum_{u,v} x_{${sel.i}+u,\\,${sel.j}+v}\\; w_{uv}`}</Tex>
        ) : users.length ? (
          <Tex>{`\\frac{\\partial L}{\\partial x_{${sel.i}${sel.j}}} = ${users.map(([i, j]) => `\\frac{\\partial L}{\\partial y_{${i}${j}}}\\, w_{${sel.i - i}${sel.j - j}}`).join(" + ")}`}</Tex>
        ) : (
          <span className="muted">This pixel isn't used by any output.</span>
        )}
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// im2col
// ---------------------------------------------------------------------------

const IM = [
  [1, 2, 0, 3],
  [4, 1, 2, 2],
  [0, 3, 1, 1],
  [2, 0, 4, 1],
];
const KER = [
  [1, 0],
  [-1, 2],
];

export function Im2colViz() {
  const [row, setRow] = useState(4);
  const k = 2;
  const o = IM.length - k + 1;
  const patches = Array.from({ length: o * o }, (_, p) => {
    const i = Math.floor(p / o);
    const j = p % o;
    return [IM[i][j], IM[i][j + 1], IM[i + 1][j], IM[i + 1][j + 1]];
  });
  const kflat = KER.flat();
  const outs = patches.map((p) => p.reduce((s, x, t) => s + x * kflat[t], 0));
  const pi = Math.floor(row / o);
  const pj = row % o;

  return (
    <Figure
      title="im2col: patches become rows"
      caption="Each 2×2 patch of the image is copied out as one row of a matrix (9 patches → 9 rows of 4). Multiplying that matrix by the flattened kernel computes all 9 outputs in one matrix-vector product, the same numbers conv2d gives. Hover a row to see its patch."
    >
      <div className="mm-row">
        <div className="mm-block">
          <div className="mm-label">image 4×4</div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(4, 2.4em)" }}>
            {IM.map((r, i) =>
              r.map((x, j) => (
                <span key={`${i}${j}`} className={`mm-cell ${i >= pi && i < pi + k && j >= pj && j < pj + k ? "row-hi" : ""}`}>
                  {x}
                </span>
              )),
            )}
          </div>
        </div>
        <span className="mm-op">→</span>
        <div className="mm-block">
          <div className="mm-label">im2col 9×4</div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(4, 2.2em)" }}>
            {patches.map((p, r) =>
              p.map((x, c) => (
                <span key={`${r}${c}`} className={`mm-cell ${r === row ? "row-hi" : ""}`} onMouseEnter={() => setRow(r)}>
                  {x}
                </span>
              )),
            )}
          </div>
        </div>
        <span className="mm-op">·</span>
        <div className="mm-block">
          <div className="mm-label">kernel, flattened</div>
          <div className="mm-grid" style={{ gridTemplateColumns: "2.4em" }}>
            {kflat.map((x, t) => (
              <span key={t} className="mm-cell col-hi">
                {x}
              </span>
            ))}
          </div>
        </div>
        <span className="mm-op">=</span>
        <div className="mm-block">
          <div className="mm-label">outputs → 3×3</div>
          <div className="mm-grid" style={{ gridTemplateColumns: "repeat(3, 2.4em)" }}>
            {outs.map((x, r) => (
              <span key={r} className={`mm-cell ${r === row ? "current" : ""}`} onMouseEnter={() => setRow(r)}>
                {x}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mm-calc mono">
        row {row}: ({patches[row].join(", ")}) · ({kflat.join(", ")}) = {patches[row].map((x, t) => `${x}·${kflat[t]}`).join(" + ")} = <strong>{outs[row]}</strong>
      </div>
    </Figure>
  );
}
