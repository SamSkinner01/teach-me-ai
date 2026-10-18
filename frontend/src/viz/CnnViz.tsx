import { useEffect, useMemo, useRef, useState, type MouseEvent as RMouseEvent } from "react";
import { Icon } from "../components/Icon";
import { cssRgb, useTheme } from "../state/theme";
import { predict, type Model, type Tensor } from "./cnn";
import { Figure, Segmented, fmt } from "./common";
import digits from "./digits.json";
import { getModel } from "./DigitDemo";

/** One MNIST test digit as 28×28 values in [0, 1]. */
export function digitImage(d: number): number[][] {
  const px = digits.images[d];
  return Array.from({ length: 28 }, (_, i) => px.slice(i * 28, i * 28 + 28).map((v) => v / 255));
}


/**
 * Draws a small 2-D array onto a canvas. "gray" maps [0, max] to black→white;
 * "diverging" maps negatives to blue and positives to orange around the surface colour.
 */
export function ArrayCanvas({
  data,
  mode = "gray",
  className = "",
  size,
  label,
}: {
  data: ArrayLike<number>[] | { h: number; w: number; values: ArrayLike<number> };
  mode?: "gray" | "diverging";
  className?: string;
  size?: number;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useTheme(); // re-render (and so redraw) when the theme changes
  const { h, w, get } = Array.isArray(data)
    ? { h: data.length, w: data[0]?.length ?? 0, get: (i: number, j: number) => data[i][j] }
    : { h: data.h, w: data.w, get: (i: number, j: number) => data.values[i * data.w + j] };

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || !h || !w) return;
    const img = ctx.createImageData(w, h);
    let max = 0;
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) max = Math.max(max, Math.abs(get(i, j)));
    max = max || 1;
    const pos = cssRgb("--viz-b");
    const neg = cssRgb("--viz-a");
    const bg = cssRgb("--surface");
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const v = get(i, j) / max;
        const o = (i * w + j) * 4;
        if (mode === "gray") {
          const g = Math.max(0, v) * 255;
          img.data[o] = img.data[o + 1] = img.data[o + 2] = g;
        } else {
          const c = v >= 0 ? pos : neg;
          const t = Math.min(1, Math.abs(v));
          for (let k = 0; k < 3; k++) img.data[o + k] = bg[k] * (1 - t) + c[k] * t;
        }
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={`array-canvas ${className}`}
      style={size ? { width: size, height: (size * h) / w } : undefined}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}

export function DigitPicker({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div className="digit-picker" role="radiogroup" aria-label="Digit">
      {digits.labels.map((d) => (
        <button key={d} role="radio" aria-checked={d === value} className={d === value ? "on" : ""} onClick={() => onChange(d)}>
          {d}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convolution explorer
// ---------------------------------------------------------------------------

const KERNELS: Record<string, { label: string; k: number[][] }> = {
  vertical: { label: "Vertical edges", k: [[1, 0, -1], [1, 0, -1], [1, 0, -1]] },
  horizontal: { label: "Horizontal edges", k: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]] },
  diagonal: { label: "Diagonal", k: [[0, 1, 2], [-1, 0, 1], [-2, -1, 0]] },
  blur: { label: "Blur", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)) },
  sharpen: { label: "Sharpen", k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
};

function conv2d(img: number[][], k: number[][]): number[][] {
  const kh = k.length;
  const kw = k[0].length;
  return Array.from({ length: img.length - kh + 1 }, (_, i) =>
    Array.from({ length: img[0].length - kw + 1 }, (_, j) => {
      let s = 0;
      for (let u = 0; u < kh; u++) for (let v = 0; v < kw; v++) s += img[i + u][j + v] * k[u][v];
      return s;
    }),
  );
}

export function ConvolutionViz() {
  const [digit, setDigit] = useState(3);
  const [preset, setPreset] = useState("vertical");
  const [kernel, setKernel] = useState<number[][]>(KERNELS.vertical.k);
  const [pos, setPos] = useState<[number, number]>([8, 10]);
  const [playing, setPlaying] = useState(false);
  const img = useMemo(() => digitImage(digit), [digit]);
  const out = useMemo(() => conv2d(img, kernel), [img, kernel]);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setPos(([i, j]) => {
        const n = i * 26 + j + 3;
        if (n >= 26 * 26) {
          setPlaying(false);
          return [25, 25];
        }
        return [Math.floor(n / 26), n % 26];
      });
    }, 30);
    return () => window.clearInterval(t);
  }, [playing]);

  const P = 8; // display pixels per image pixel
  const [i, j] = pos;
  const patch = kernel.map((row, u) => row.map((_, v) => img[i + u][j + v]));
  const value = out[i][j];

  function setCell(u: number, v: number, s: string) {
    const n = Number(s);
    if (!Number.isFinite(n)) return;
    setPreset("custom");
    setKernel(kernel.map((row, a) => row.map((x, b) => (a === u && b === v ? n : x))));
  }

  const hoverOut = (e: RMouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const jj = Math.floor(((e.clientX - r.left) / r.width) * 26);
    const ii = Math.floor(((e.clientY - r.top) / r.height) * 26);
    if (ii >= 0 && ii < 26 && jj >= 0 && jj < 26) setPos([ii, jj]);
  };

  return (
    <Figure
      title="A kernel sliding over a digit"
      caption="The 3×3 kernel visits every position where it fits. At each one, it multiplies the 9 pixels under it by its 9 weights and adds them up, giving one pixel of the feature map. Orange means a strong positive response, blue a strong negative one. Hover over the feature map to move the window, or press Play to watch it sweep."
      controls={
        <>
          <DigitPicker value={digit} onChange={setDigit} />
          <Segmented
            label="Kernel"
            value={preset}
            onChange={(k) => {
              setPreset(k);
              if (KERNELS[k]) setKernel(KERNELS[k].k);
            }}
            options={[...Object.entries(KERNELS).map(([k, v]) => ({ value: k, label: v.label })), ...(preset === "custom" ? [{ value: "custom", label: "Custom" }] : [])]}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              if (!playing && i * 26 + j >= 26 * 26 - 3) setPos([0, 0]);
              setPlaying(!playing);
            }}
          >
            <Icon name={playing ? "clock" : "play"} size={14} /> {playing ? "Pause" : "Play"}
          </button>
        </>
      }
    >
      <div className="conv-grid">
        <div className="conv-panel">
          <div className="small muted">input (28×28)</div>
          <div className="conv-stage" style={{ width: 28 * P, height: 28 * P }}>
            <ArrayCanvas data={img} size={28 * P} label={`MNIST digit ${digit}`} />
            <div className="conv-window" style={{ left: j * P, top: i * P, width: 3 * P, height: 3 * P }} />
          </div>
        </div>
        <div className="conv-panel conv-middle">
          <div className="small muted">kernel (editable)</div>
          <div className="kernel-grid">
            {kernel.map((row, u) =>
              row.map((x, v) => (
                <input
                  key={`${u}${v}`}
                  className={`kernel-cell ${x > 0 ? "pos" : x < 0 ? "neg" : ""}`}
                  value={Number(x.toFixed(2))}
                  type="number"
                  step={0.5}
                  aria-label={`kernel weight row ${u + 1} column ${v + 1}`}
                  onChange={(e) => setCell(u, v, e.target.value)}
                />
              )),
            )}
          </div>
          <div className="small muted">pixels under the window</div>
          <div className="patch-grid">
            {patch.map((row, u) =>
              row.map((x, v) => (
                <span key={`${u}${v}`} style={{ opacity: 0.35 + 0.65 * x }}>
                  {x.toFixed(1)}
                </span>
              )),
            )}
          </div>
          <div className="conv-sum mono small">
            Σ pixel × weight = <strong>{fmt(value, 2)}</strong>
          </div>
        </div>
        <div className="conv-panel">
          <div className="small muted">feature map (26×26)</div>
          <div className="conv-stage" style={{ width: 26 * P, height: 26 * P }} onMouseMove={hoverOut}>
            <ArrayCanvas data={out} mode="diverging" size={26 * P} label="Feature map" />
            <div className="conv-window out" style={{ left: j * P, top: i * P, width: P, height: P }} />
          </div>
        </div>
      </div>
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// Inside the demo CNN
// ---------------------------------------------------------------------------

function slice(t: Tensor, c: number) {
  const [, h, w] = t.shape;
  return { h, w, values: t.data.subarray(c * h * w, (c + 1) * h * w) };
}

export function FeatureMapsViz() {
  const [digit, setDigit] = useState(7);
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getModel().then(setModel, (e) => setError(String(e)));
  }, []);
  const img = useMemo(() => digitImage(digit), [digit]);
  const result = useMemo(() => {
    if (!model) return null;
    const input = new Float32Array(784);
    img.flat().forEach((v, k) => (input[k] = (v - model.mean) / model.std));
    return predict(model, { shape: [1, 28, 28], data: input });
  }, [model, img]);

  if (error) return <div className="alert alert-error">Couldn't load the demo network: {error}</div>;
  const acts = result?.activations;
  const conv1 = model?.layers[0];
  const filters = conv1 && conv1.type === "conv" ? conv1.w : null;

  return (
    <Figure
      title="Inside a trained CNN"
      caption="The demo network from the first lesson, opened up. Its 8 first-layer filters (each a 3×3 kernel it learned) produce 8 feature maps; pooling halves them; 16 second-layer filters, each looking at all 8 maps, respond to larger patterns; pooling again; then a dense layer turns the 400 remaining numbers into 10 scores. Orange is positive, blue negative; black-and-white maps are after ReLU."
      controls={<DigitPicker value={digit} onChange={setDigit} />}
    >
      {!acts || !filters ? (
        <div className="muted">
          <span className="spinner" /> Loading the network…
        </div>
      ) : (
        <div className="fm-layout">
          <div className="fm-row">
            <div className="fm-cell">
              <ArrayCanvas data={img} size={84} label="input" />
              <span className="small muted">input 28×28</span>
            </div>
            <div className="fm-group">
              <div className="small muted">layer 1: 8 learned 3×3 filters → ReLU feature maps (26×26) → pooled (13×13)</div>
              <div className="fm-maps">
                {Array.from({ length: 8 }, (_, c) => (
                  <div key={c} className="fm-stack">
                    <ArrayCanvas data={{ h: 3, w: 3, values: filters.data.subarray(c * 9, c * 9 + 9) }} mode="diverging" size={30} label={`filter ${c + 1}`} />
                    <ArrayCanvas data={slice(acts[1], c)} size={52} />
                    <ArrayCanvas data={slice(acts[2], c)} size={26} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="fm-group">
            <div className="small muted">layer 2: 16 filters, each spanning all 8 maps → ReLU maps (11×11) → pooled (5×5)</div>
            <div className="fm-maps wide">
              {Array.from({ length: 16 }, (_, c) => (
                <div key={c} className="fm-stack">
                  <ArrayCanvas data={slice(acts[4], c)} size={44} />
                  <ArrayCanvas data={slice(acts[5], c)} size={20} />
                </div>
              ))}
            </div>
          </div>
          <div className="fm-group">
            <div className="small muted">dense layer: 400 numbers → 10 scores → softmax</div>
            <div className="fm-probs">
              {result!.probs.map((p, d) => (
                <div key={d} className={`fm-prob ${p === Math.max(...result!.probs) ? "best" : ""}`}>
                  <span className="fm-bar" style={{ height: `${Math.max(2, p * 100)}%` }} />
                  <span className="mono small">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Figure>
  );
}
