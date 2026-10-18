import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { cssRgb, useTheme } from "../state/theme";
import { Figure, Segmented, Slider, fmt, linear } from "./common";
import { Rng } from "./random";

type Point = [number, number, number]; // x, y, class

function makeData(kind: string): { points: Point[]; classes: number } {
  const rng = new Rng(20261017);
  const pts: Point[] = [];
  const noise = () => rng.normal() * 0.18;
  if (kind === "xor") {
    for (let i = 0; i < 100; i++) {
      const x = rng.uniform() * 4 - 2;
      const y = rng.uniform() * 4 - 2;
      if (Math.abs(x) < 0.15 || Math.abs(y) < 0.15) continue;
      pts.push([x, y, x * y > 0 ? 0 : 1]);
    }
    return { points: pts, classes: 2 };
  }
  if (kind === "circle") {
    for (let i = 0; i < 120; i++) {
      const inner = i % 2 === 0;
      const r = inner ? rng.uniform() * 0.8 : 1.3 + rng.uniform() * 0.6;
      const t = rng.uniform() * 2 * Math.PI;
      pts.push([r * Math.cos(t), r * Math.sin(t), inner ? 0 : 1]);
    }
    return { points: pts, classes: 2 };
  }
  if (kind === "spiral") {
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < 50; i++) {
        const r = (i / 50) * 1.9 + 0.1;
        const t = (i / 50) * 3.2 + (c * 2 * Math.PI) / 3;
        pts.push([r * Math.cos(t) + noise() * 0.4, r * Math.sin(t) + noise() * 0.4, c]);
      }
    }
    return { points: pts, classes: 3 };
  }
  // three blobs
  const centres = [
    [-1.1, -0.8],
    [1.1, -0.6],
    [0, 1.2],
  ];
  centres.forEach(([cx, cy], c) => {
    for (let i = 0; i < 30; i++) pts.push([cx + noise() * 2, cy + noise() * 2, c]);
  });
  return { points: pts, classes: 3 };
}

/** A 2 → hidden (ReLU) → classes network, trained with full-batch gradient descent: the train_mlp exercise in JS. */
class Mlp {
  w1: Float64Array;
  b1: Float64Array;
  w2: Float64Array;
  b2: Float64Array;
  constructor(
    public hidden: number,
    public classes: number,
    seed: number,
  ) {
    const rng = new Rng(seed);
    this.w1 = Float64Array.from({ length: hidden * 2 }, () => rng.normal() * Math.sqrt(2 / 2));
    this.b1 = new Float64Array(hidden);
    this.w2 = Float64Array.from({ length: classes * hidden }, () => rng.normal() * Math.sqrt(2 / hidden));
    this.b2 = new Float64Array(classes);
  }

  forward(x: number, y: number, h: Float64Array, z: Float64Array, p: Float64Array) {
    const H = this.hidden;
    for (let j = 0; j < H; j++) {
      z[j] = this.w1[j * 2] * x + this.w1[j * 2 + 1] * y + this.b1[j];
      h[j] = z[j] > 0 ? z[j] : 0;
    }
    let m = -Infinity;
    for (let k = 0; k < this.classes; k++) {
      let s = this.b2[k];
      for (let j = 0; j < H; j++) s += this.w2[k * H + j] * h[j];
      p[k] = s;
      if (s > m) m = s;
    }
    let total = 0;
    for (let k = 0; k < this.classes; k++) {
      p[k] = Math.exp(p[k] - m);
      total += p[k];
    }
    for (let k = 0; k < this.classes; k++) p[k] /= total;
  }

  /** One full-batch gradient-descent step. Returns [loss, accuracy] before the step. */
  step(points: Point[], lr: number): [number, number] {
    const H = this.hidden;
    const C = this.classes;
    const n = points.length;
    const gw1 = new Float64Array(this.w1.length);
    const gb1 = new Float64Array(H);
    const gw2 = new Float64Array(this.w2.length);
    const gb2 = new Float64Array(C);
    const h = new Float64Array(H);
    const z = new Float64Array(H);
    const p = new Float64Array(C);
    const dh = new Float64Array(H);
    let loss = 0;
    let correct = 0;
    for (const [x, y, c] of points) {
      this.forward(x, y, h, z, p);
      loss -= Math.log(Math.max(p[c], 1e-300));
      let best = 0;
      for (let k = 1; k < C; k++) if (p[k] > p[best]) best = k;
      if (best === c) correct++;
      dh.fill(0);
      for (let k = 0; k < C; k++) {
        const g = (p[k] - (k === c ? 1 : 0)) / n;
        gb2[k] += g;
        for (let j = 0; j < H; j++) {
          gw2[k * H + j] += g * h[j];
          dh[j] += g * this.w2[k * H + j];
        }
      }
      for (let j = 0; j < H; j++) {
        if (z[j] <= 0) continue;
        gb1[j] += dh[j];
        gw1[j * 2] += dh[j] * x;
        gw1[j * 2 + 1] += dh[j] * y;
      }
    }
    for (let i = 0; i < this.w1.length; i++) this.w1[i] -= lr * gw1[i];
    for (let i = 0; i < H; i++) this.b1[i] -= lr * gb1[i];
    for (let i = 0; i < this.w2.length; i++) this.w2[i] -= lr * gw2[i];
    for (let i = 0; i < C; i++) this.b2[i] -= lr * gb2[i];
    return [loss / n, correct / n];
  }
}


const R = 2.4;
const RES = 64;

export function PlaygroundViz() {
  const [dataset, setDataset] = useState("xor");
  const [hidden, setHidden] = useState(8);
  const [lr, setLr] = useState(0.3);
  const [seed, setSeed] = useState(42);
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState({ epoch: 0, loss: NaN, acc: NaN });
  const [history, setHistory] = useState<number[]>([]);
  const data = useMemo(() => makeData(dataset), [dataset]);
  const model = useRef(new Mlp(hidden, data.classes, seed));
  const canvas = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const cols = [cssRgb("--viz-a"), cssRgb("--viz-b"), cssRgb("--viz-c")];
    const bg = cssRgb("--surface");
    const m = model.current;
    const h = new Float64Array(m.hidden);
    const z = new Float64Array(m.hidden);
    const p = new Float64Array(m.classes);
    const img = ctx.createImageData(RES, RES);
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        m.forward(-R + (2 * R * (i + 0.5)) / RES, R - (2 * R * (j + 0.5)) / RES, h, z, p);
        const o = (j * RES + i) * 4;
        for (let c = 0; c < 3; c++) {
          let v = 0;
          for (let k = 0; k < m.classes; k++) v += p[k] * cols[k][c];
          img.data[o + c] = bg[c] * 0.55 + v * 0.45;
        }
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  const reset = useCallback(
    (nextSeed = seed, nextHidden = hidden, classes = data.classes) => {
      model.current = new Mlp(nextHidden, classes, nextSeed);
      setStats({ epoch: 0, loss: NaN, acc: NaN });
      setHistory([]);
      draw();
    },
    [seed, hidden, data.classes, draw],
  );

  const train = useCallback(
    (epochs: number) => {
      let last: [number, number] = [NaN, NaN];
      for (let e = 0; e < epochs; e++) last = model.current.step(data.points, lr);
      setStats((s) => ({ epoch: s.epoch + epochs, loss: last[0], acc: last[1] }));
      setHistory((hst) => [...hst, last[0]].slice(-300));
      draw();
    },
    [data, lr, draw],
  );

  useEffect(() => {
    reset(seed, hidden, data.classes);
  }, [data]);
  useEffect(draw, [draw, theme]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      train(10);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, train]);

  const S = 320;
  const sx = linear(-R, R, 0, S);
  const sy = linear(-R, R, S, 0);
  const HW = 220;
  const HH = 70;
  const hmax = Math.max(0.1, ...history.filter(Number.isFinite));
  const hx = linear(0, Math.max(1, history.length - 1), 4, HW - 4);
  const hy = linear(0, hmax, HH - 6, 6);

  return (
    <Figure
      title="Training playground"
      caption="A network with one hidden layer of ReLU neurons, trained with full-batch gradient descent, exactly like your train_mlp. The background shows what it would predict at every point. Too few hidden neurons and it can't bend its boundary enough; too high a learning rate and the loss jumps around."
      controls={
        <>
          <Segmented
            label="Dataset"
            value={dataset}
            onChange={(v) => {
              setPlaying(false);
              setDataset(v);
            }}
            options={[
              { value: "xor", label: "XOR" },
              { value: "circle", label: "Circle" },
              { value: "blobs", label: "3 blobs" },
              { value: "spiral", label: "Spiral" },
            ]}
          />
          <Slider
            label="hidden neurons"
            value={hidden}
            min={1}
            max={32}
            step={1}
            onChange={(v) => {
              setHidden(v);
              reset(seed, v);
            }}
            format={String}
            width={140}
          />
          <Slider label="learning rate" value={lr} min={0.01} max={2} step={0.01} onChange={setLr} format={(v) => fmt(v, 2)} width={140} />
          <div className="preset-row">
            <button className="btn btn-sm btn-primary" onClick={() => setPlaying(!playing)}>
              <Icon name={playing ? "clock" : "play"} size={14} /> {playing ? "Pause" : "Train"}
            </button>
            <button className="btn btn-sm" onClick={() => train(1)} disabled={playing}>
              Step
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                const s = seed + 1;
                setSeed(s);
                reset(s);
              }}
            >
              <Icon name="reset" size={14} /> New weights
            </button>
          </div>
        </>
      }
    >
      <div className="viz-split">
        <div className="gf-stage playground-stage">
          <canvas ref={canvas} width={RES} height={RES} className="gf-canvas" aria-hidden="true" />
          <svg viewBox={`0 0 ${S} ${S}`} className="viz-svg square gf-overlay" role="img" aria-label="Data and decision regions">
            {data.points.map(([x, y, c], i) => (
              <circle key={i} cx={sx(x)} cy={sy(y)} r={4} className={`class-dot c${c}`} />
            ))}
          </svg>
        </div>
        <div className="viz-readout">
          <div className="readout-big">
            epoch <strong>{stats.epoch}</strong>
          </div>
          <div className="readout-row">
            loss <strong className="mono">{Number.isFinite(stats.loss) ? fmt(stats.loss, 4) : "–"}</strong>
          </div>
          <div className="readout-row">
            accuracy <strong className="mono">{Number.isFinite(stats.acc) ? `${(stats.acc * 100).toFixed(1)}%` : "–"}</strong>
          </div>
          <svg viewBox={`0 0 ${HW} ${HH}`} className="ce-spark" role="img" aria-label="Loss history">
            {history.length > 1 && (
              <path d={"M" + history.map((l, i) => `${hx(i).toFixed(1)},${hy(Math.min(l, hmax)).toFixed(1)}`).join("L")} className="running-path" />
            )}
          </svg>
          <div className="readout-note">
            {model.current.hidden * 2 + model.current.hidden + model.current.classes * model.current.hidden + model.current.classes} weights
            in total. Try the spiral with 2 neurons, then with 32.
          </div>
        </div>
      </div>
    </Figure>
  );
}
