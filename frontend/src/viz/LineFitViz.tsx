import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Tex } from "../components/RichText";
import { Figure, Segmented, Slider, clamp, fmt, linear, useSvgDrag } from "./common";
import { ContourCanvas } from "./contour";
import { xorshift32 } from "./random";

// A small noisy dataset around y = 0.6x + 1.
const XS = [0.5, 1.2, 2.0, 2.8, 3.5, 4.1, 5.0, 5.6, 6.3, 7.0, 7.8, 8.5];
const YS = [1.6, 1.4, 2.5, 2.4, 3.4, 3.2, 4.3, 4.1, 4.6, 5.4, 5.5, 6.3];
const N = XS.length;

const W_RANGE: [number, number] = [-1, 2];
const B_RANGE: [number, number] = [-3, 5];
const START: [number, number] = [-0.5, 4];

function mse(w: number, b: number, idx?: number[]) {
  const ids = idx ?? XS.map((_, i) => i);
  let s = 0;
  for (const i of ids) s += (w * XS[i] + b - YS[i]) ** 2;
  return s / ids.length;
}

function grad(w: number, b: number, idx: number[]): [number, number] {
  let gw = 0;
  let gb = 0;
  for (const i of idx) {
    const g = (2 / idx.length) * (w * XS[i] + b - YS[i]);
    gw += g * XS[i];
    gb += g;
  }
  return [gw, gb];
}

/** Fisher–Yates with xorshift32, exactly like the shuffled_indices exercise. */
function shuffled(seed: number, n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  let state = seed;
  for (let i = n - 1; i >= 1; i--) {
    state = xorshift32(state);
    const j = state % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

const lossSurface = (w: number, b: number) => mse(w, b);

// The exact least-squares line, for reference: w = cov(x, y) / var(x), b = ȳ − w·x̄.
const BEST = (() => {
  const mx = XS.reduce((a, v) => a + v, 0) / N;
  const my = YS.reduce((a, v) => a + v, 0) / N;
  let cov = 0;
  let vx = 0;
  XS.forEach((x, i) => {
    cov += (x - mx) * (YS[i] - my);
    vx += (x - mx) ** 2;
  });
  const w = cov / vx;
  return { w, b: my - w * mx, loss: mse(w, my - w * mx) };
})();

type Mode = "explore" | "gd" | "sgd";

export function LineFitViz({ mode = "explore" }: { mode?: Mode }) {
  const [wb, setWbState] = useState<[number, number]>(mode === "explore" ? [0.2, 2] : START);
  const wbRef = useRef(wb);
  const setWb = useCallback((v: [number, number]) => {
    wbRef.current = v;
    setWbState(v);
  }, []);
  const [lr, setLr] = useState(0.02);
  const [batch, setBatch] = useState(mode === "sgd" ? "2" : "all");
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cursor = useRef({ epoch: 0, order: shuffled(42, N), pos: 0 });

  const [w, b] = wb;
  const loss = mse(w, b);

  // scatter plot
  const SW = 380;
  const SH = 300;
  const px = linear(0, 9, 30, SW - 10);
  const py = linear(-1, 8, SH - 24, 10);

  // contour plot
  const C = 300;
  const cx = useMemo(() => linear(W_RANGE[0], W_RANGE[1], 0, C), []);
  const cy = useMemo(() => linear(B_RANGE[0], B_RANGE[1], C, 0), []);
  const drag = useSvgDrag(
    useCallback(
      (x: number, y: number) => {
        if (mode !== "explore") return;
        setWb([clamp(cx.invert(x), ...W_RANGE), clamp(cy.invert(y), ...B_RANGE)]);
      },
      [mode, cx, cy],
    ),
  );

  // Reads and writes the weights through a ref so the mini-batch cursor can be
  // advanced outside React's state updaters (which StrictMode runs twice).
  const step = useCallback(() => {
    const [w0, b0] = wbRef.current;
    let idx: number[];
    const c = cursor.current;
    if (mode === "sgd" && batch !== "all") {
      if (c.pos >= N) {
        c.epoch += 1;
        c.order = shuffled(42 + c.epoch, N);
        c.pos = 0;
      }
      idx = c.order.slice(c.pos, c.pos + Number(batch));
      c.pos += Number(batch);
    } else {
      idx = XS.map((_, i) => i);
      c.epoch += 1;
    }
    const [gw, gb] = grad(w0, b0, idx);
    const next: [number, number] = [w0 - lr * gw, b0 - lr * gb];
    if (!Number.isFinite(next[0]) || !Number.isFinite(next[1]) || Math.abs(next[0]) > 1e6) {
      setPlaying(false);
      return;
    }
    setWb(next);
    setTrail((t) => [...t, [w0, b0] as [number, number]].slice(-600));
    setSteps((s) => s + 1);
  }, [mode, batch, lr, setWb]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      for (let i = 0; i < 3; i++) step();
    }, 60);
    return () => window.clearInterval(t);
  }, [playing, step]);

  function reset() {
    setPlaying(false);
    setWb(START);
    setTrail([]);
    setSteps(0);
    cursor.current = { epoch: 0, order: shuffled(42, N), pos: 0 };
  }

  const title =
    mode === "explore" ? "Fit a line by hand" : mode === "gd" ? "Gradient descent fits the line" : "Mini-batch SGD fits the line";
  const caption =
    mode === "explore"
      ? "Move the sliders, or drag the point on the right-hand plot, to change the line's slope w and intercept b. The vertical red segments are the errors. The loss is the average of their squares, and the right-hand plot shows it for every (w, b) at once: darker means higher loss, so the best line is in the lightest region in the middle."
      : mode === "gd"
        ? "Each step moves (w, b) against the gradient of the loss. Watch the path on the loss surface: it shoots quickly down the steep direction and then crawls along the shallow one. Push the learning rate up and it starts to zig-zag, then blows up."
        : "Each step uses only a few points (a mini-batch) to estimate the gradient, so the path is noisy. But each step is much cheaper, and on average it still heads downhill. Batch size 1 is the noisiest; “all” is ordinary gradient descent.";

  return (
    <Figure
      title={title}
      caption={caption}
      controls={
        mode === "explore" ? (
          <>
            <Slider label="slope w" value={w} min={W_RANGE[0]} max={W_RANGE[1]} step={0.01} onChange={(v) => setWb([v, b])} />
            <Slider label="intercept b" value={b} min={B_RANGE[0]} max={B_RANGE[1]} step={0.05} onChange={(v) => setWb([w, v])} />
          </>
        ) : (
          <>
            <Slider label="learning rate" value={lr} min={0.001} max={0.045} step={0.001} onChange={setLr} format={(v) => fmt(v, 3)} />
            {mode === "sgd" && (
              <Segmented
                label="Batch size"
                value={batch}
                onChange={(v) => {
                  setBatch(v);
                  reset();
                }}
                options={["1", "2", "4", "all"].map((v) => ({ value: v, label: v === "all" ? "all 12" : `batch ${v}` }))}
              />
            )}
            <div className="preset-row">
              <button className="btn btn-sm" onClick={step}>
                Step
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => setPlaying(!playing)}>
                <Icon name={playing ? "clock" : "play"} size={14} /> {playing ? "Pause" : "Play"}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={reset}>
                <Icon name="reset" size={14} /> Reset
              </button>
            </div>
          </>
        )
      }
    >
      <div className="fit-grid">
        <svg viewBox={`0 0 ${SW} ${SH}`} className="viz-svg" role="img" aria-label="Data points and fitted line">
          <line x1={px(0)} x2={px(9)} y1={py(0)} y2={py(0)} className="viz-axisline" />
          <line x1={px(0)} x2={px(0)} y1={py(-1)} y2={py(8)} className="viz-axisline" />
          {XS.map((x, i) => (
            <line key={`r${i}`} x1={px(x)} x2={px(x)} y1={py(YS[i])} y2={py(w * x + b)} className="residual" />
          ))}
          <line x1={px(0)} y1={py(b)} x2={px(9)} y2={py(w * 9 + b)} className="fit-line" />
          {XS.map((x, i) => (
            <circle key={i} cx={px(x)} cy={py(YS[i])} r={4.5} className="data-dot" />
          ))}
          <text x={SW - 10} y={SH - 6} textAnchor="end" className="tick">
            x
          </text>
          <text x={34} y={16} className="tick">
            y
          </text>
        </svg>
        <div className="gf-stage fit-contour">
          <ContourCanvas f={lossSurface} x0={W_RANGE[0]} x1={W_RANGE[1]} y0={B_RANGE[0]} y1={B_RANGE[1]} res={160} levels={16} />
          <svg viewBox={`0 0 ${C} ${C}`} className="viz-svg square gf-overlay" role="img" aria-label="Loss over slope and intercept" {...drag}>
            {trail.length > 0 && (
              <polyline points={[...trail, wb].map(([a, c]) => `${cx(a)},${cy(c)}`).join(" ")} className="gf-trail" />
            )}
            <circle cx={cx(w)} cy={cy(b)} r={7} className="viz-point" />
            <text x={C - 6} y={C - 6} textAnchor="end" className="tick">
              w →
            </text>
            <text x={6} y={14} className="tick">
              ↑ b
            </text>
          </svg>
        </div>
        <div className="viz-readout">
          <div className="readout-big">
            <Tex>{`\\text{MSE} = ${fmt(loss, 4)}`}</Tex>
          </div>
          <div className="readout-row">
            <Tex>{`\\hat y = ${fmt(w, 3)}\\,x ${b < 0 ? "-" : "+"} ${fmt(Math.abs(b), 3)}`}</Tex>
          </div>
          {mode !== "explore" && (
            <>
              <div className="readout-row small muted">
                {steps} step{steps === 1 ? "" : "s"}
                {mode === "sgd" && batch !== "all" ? `, epoch ${cursor.current.epoch + 1}` : ""}
              </div>
              <div className="readout-row small muted">
                best possible: <Tex>{`w = ${fmt(BEST.w, 3)},\\ b = ${fmt(BEST.b, 3)},\\ \\text{MSE} = ${fmt(BEST.loss, 4)}`}</Tex>
              </div>
            </>
          )}
        </div>
      </div>
    </Figure>
  );
}
