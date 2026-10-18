import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { Icon } from "../components/Icon";
import { loadModel, mnistify, predict, type Model, type ModelFile, type Prediction, type Tensor } from "./cnn";

const SIZE = 280;
let modelPromise: Promise<Model> | null = null;

export function getModel(): Promise<Model> {
  modelPromise ??= fetch("/models/demo-cnn.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<ModelFile>;
    })
    .then(loadModel);
  modelPromise.catch(() => (modelPromise = null));
  return modelPromise;
}

function drawGray(canvas: HTMLCanvasElement | null, data: ArrayLike<number>, w: number, h: number, max = 1) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = Math.max(0, Math.min(255, (data[i] / (max || 1)) * 255));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function FeatureMap({ t, channel }: { t: Tensor; channel: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [, h, w] = t.shape;
  useEffect(() => {
    const slice = t.data.subarray(channel * h * w, (channel + 1) * h * w);
    let max = 0;
    for (const v of slice) max = Math.max(max, v);
    drawGray(ref.current, slice, w, h, max);
  }, [t, channel, h, w]);
  return <canvas ref={ref} width={w} height={h} className="fmap" aria-label={`Feature map ${channel + 1}`} />;
}

export function DigitDemo({ compact = false }: { compact?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);
  const pending = useRef<number | undefined>(undefined);
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pred, setPred] = useState<Prediction | null>(null);

  useEffect(() => {
    getModel().then(setModel, (e) => setError(String(e)));
  }, []);

  const clear = useCallback(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    setPred(null);
    drawGray(preview.current, new Float32Array(784), 28, 28);
  }, []);

  useEffect(clear, [clear]);

  const classify = useCallback(() => {
    pending.current = undefined;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !model) return;
    const img = ctx.getImageData(0, 0, SIZE, SIZE).data;
    const ink = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < ink.length; i++) ink[i] = img[i * 4] / 255;
    const digit = mnistify(ink, SIZE, SIZE);
    if (!digit) {
      setPred(null);
      return;
    }
    drawGray(preview.current, digit, 28, 28);
    const input = new Float32Array(784);
    for (let i = 0; i < 784; i++) input[i] = (digit[i] - model.mean) / model.std;
    setPred(predict(model, { shape: [1, 28, 28], data: input }));
  }, [model]);

  const schedule = () => {
    if (pending.current === undefined) pending.current = window.setTimeout(classify, 60);
  };

  function point(e: RPointerEvent<HTMLCanvasElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE];
  }

  function stroke(from: [number, number], to: [number, number]) {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 19;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(...from);
    ctx.lineTo(...to);
    ctx.stroke();
  }

  const probs = pred?.probs;
  const best = probs ? probs.indexOf(Math.max(...probs)) : null;
  const conv1 = pred?.activations[1];

  return (
    <figure className={`viz card digit-demo ${compact ? "compact" : ""}`}>
      <div className="viz-head">
        <span className="viz-kicker">Interactive</span>
        <span className="viz-title">Draw a digit</span>
      </div>
      <div className="dd-body">
        <div className="dd-draw">
          <canvas
            ref={canvas}
            width={SIZE}
            height={SIZE}
            className="dd-canvas"
            aria-label="Drawing area: draw a digit from 0 to 9"
            onPointerDown={(e) => {
              drawing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = point(e);
              last.current = p;
              stroke(p, p);
              schedule();
            }}
            onPointerMove={(e) => {
              if (!drawing.current || !last.current) return;
              const p = point(e);
              stroke(last.current, p);
              last.current = p;
              schedule();
            }}
            onPointerUp={() => {
              drawing.current = false;
              last.current = null;
              classify();
            }}
            onPointerCancel={() => {
              drawing.current = false;
              last.current = null;
            }}
          />
          <div className="dd-tools">
            <button className="btn btn-sm" onClick={clear}>
              <Icon name="trash" size={14} /> Clear
            </button>
            <span className="small muted">Draw one big digit, 0–9.</span>
          </div>
        </div>

        <div className="dd-result">
          {error ? (
            <div className="alert alert-error">Couldn't load the demo model ({error}).</div>
          ) : !model ? (
            <div className="muted">
              <span className="spinner" /> Loading the network…
            </div>
          ) : (
            <>
              <div className="dd-guess">
                <span className="muted small">The network thinks it's a</span>
                <span className="dd-digit">{best ?? "?"}</span>
                {probs && best !== null && <span className="muted small">{(probs[best] * 100).toFixed(1)}% sure</span>}
              </div>
              <div className="dd-bars" role="list" aria-label="Probability of each digit">
                {Array.from({ length: 10 }, (_, d) => (
                  <div key={d} className={`dd-bar ${d === best ? "best" : ""}`} role="listitem">
                    <span className="mono">{d}</span>
                    <span className="dd-track">
                      <span style={{ width: `${((probs?.[d] ?? 0) * 100).toFixed(1)}%` }} />
                    </span>
                    <span className="mono small dd-pct">{probs ? `${(probs[d] * 100).toFixed(0)}%` : ""}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!compact && (
          <div className="dd-inside">
            <div>
              <div className="small muted">What the network receives (28×28)</div>
              <canvas ref={preview} width={28} height={28} className="dd-preview" aria-label="Downscaled 28 by 28 input" />
            </div>
            <div>
              <div className="small muted">What its 8 first-layer filters respond to</div>
              <div className="fmaps">
                {conv1
                  ? Array.from({ length: conv1.shape[0] }, (_, c) => <FeatureMap key={c} t={conv1} channel={c} />)
                  : Array.from({ length: 8 }, (_, c) => <span key={c} className="fmap empty" />)}
              </div>
            </div>
          </div>
        )}
      </div>
      <figcaption className="viz-caption">
        A small convolutional network (about 5,000 numbers, {model ? `${(model.accuracy * 100).toFixed(1)}%` : "≈98%"}{" "}
        accurate on MNIST's test set) running in your browser. Every number in it was learned with the math you're about
        to study.
      </figcaption>
    </figure>
  );
}
