import { useRef, useState } from "react";
import { Tex } from "../components/RichText";
import { Figure, Segmented, fmt, linear } from "./common";
import { Rng } from "./random";

interface Dist {
  label: string;
  values: number[];
  probs: number[];
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const DISTS: Record<string, Dist> = {
  die: { label: "Fair die", values: range(1, 6), probs: Array(6).fill(1 / 6) },
  loaded: { label: "Loaded die", values: range(1, 6), probs: [0.1, 0.1, 0.1, 0.1, 0.1, 0.5] },
  coin: { label: "Coin (0 or 1)", values: [0, 1], probs: [0.5, 0.5] },
  twodice: { label: "Sum of two dice", values: range(2, 12), probs: range(2, 12).map((s) => (6 - Math.abs(s - 7)) / 36) },
};

const W = 460;
const H = 230;
const PAD = 28;
const MAX_HISTORY = 4000;

export function SamplingViz() {
  const [key, setKey] = useState("die");
  const D = DISTS[key];
  const rng = useRef(new Rng(20261017));
  const [counts, setCounts] = useState<number[]>(() => D.values.map(() => 0));
  const [sum, setSum] = useState({ n: 0, s: 0, s2: 0 });
  const [history, setHistory] = useState<number[]>([]);

  const mu = D.values.reduce((acc, v, i) => acc + v * D.probs[i], 0);
  const variance = D.values.reduce((acc, v, i) => acc + (v - mu) ** 2 * D.probs[i], 0);

  function reset(k = key) {
    setCounts(DISTS[k].values.map(() => 0));
    setSum({ n: 0, s: 0, s2: 0 });
    setHistory([]);
  }

  function roll(times: number) {
    const c = [...counts];
    let { n, s, s2 } = sum;
    const h = [...history];
    for (let t = 0; t < times; t++) {
      const i = rng.current.categorical(D.probs);
      const v = D.values[i];
      c[i]++;
      n++;
      s += v;
      s2 += v * v;
      if (h.length < MAX_HISTORY) h.push(s / n);
    }
    setCounts(c);
    setSum({ n, s, s2 });
    setHistory(h);
  }

  const n = sum.n;
  const sampleMean = n ? sum.s / n : NaN;
  const sampleVar = n ? sum.s2 / n - sampleMean * sampleMean : NaN;
  const freqs = counts.map((c) => (n ? c / n : 0));
  const yMax = Math.max(...D.probs, ...freqs) * 1.15;

  const lo = D.values[0] - 0.6;
  const hi = D.values[D.values.length - 1] + 0.6;
  const sx = linear(lo, hi, PAD, W - 10);
  const sy = linear(0, yMax, H - PAD, 12);
  const bw = Math.min(36, ((W - PAD - 10) / D.values.length) * 0.7);

  // running-mean chart
  const RH = 130;
  const rx = linear(1, Math.max(2, history.length), PAD, W - 10);
  const spread = Math.max(...D.values) - Math.min(...D.values);
  const ry = linear(mu - spread / 2, mu + spread / 2, RH - 16, 10);
  let runningPath = "";
  if (history.length >= 2) {
    const step = Math.max(1, Math.floor(history.length / 400));
    const pts: string[] = [];
    for (let i = 0; i < history.length; i += step) pts.push(`${rx(i + 1).toFixed(1)},${ry(history[i]).toFixed(1)}`);
    runningPath = "M" + pts.join("L");
  }

  return (
    <Figure
      title="Sampling: frequencies settle down"
      caption="Outlined bars are the true probabilities; filled bars are how often each outcome actually came up. With a handful of rolls they disagree a lot. With thousands, the frequencies and the sample mean settle onto the true values: the law of large numbers."
      controls={
        <>
          <Segmented
            label="Distribution"
            value={key}
            onChange={(k) => {
              setKey(k);
              reset(k);
            }}
            options={Object.entries(DISTS).map(([k, d]) => ({ value: k, label: d.label }))}
          />
          <div className="preset-row">
            {[1, 10, 100, 1000].map((t) => (
              <button key={t} className="btn btn-sm" onClick={() => roll(t)}>
                Roll {t}
              </button>
            ))}
            <button className="btn btn-sm btn-ghost" onClick={() => reset()}>
              Reset
            </button>
          </div>
        </>
      }
    >
      <div className="viz-split">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" role="img" aria-label="Histogram of outcomes">
            <line x1={PAD} x2={W - 10} y1={sy(0)} y2={sy(0)} className="viz-axisline" />
            {D.values.map((v, i) => (
              <g key={v}>
                <rect x={sx(v) - bw / 2} y={sy(freqs[i])} width={bw} height={sy(0) - sy(freqs[i])} className="bar-obs" />
                <rect x={sx(v) - bw / 2} y={sy(D.probs[i])} width={bw} height={sy(0) - sy(D.probs[i])} className="bar-true" />
                <text x={sx(v)} y={H - 10} textAnchor="middle" className="tick">
                  {v}
                </text>
              </g>
            ))}
            <line x1={sx(mu)} x2={sx(mu)} y1={8} y2={sy(0)} className="mean-true" />
            {n > 0 && <line x1={sx(sampleMean)} x2={sx(sampleMean)} y1={8} y2={sy(0)} className="mean-sample" />}
          </svg>
          <svg viewBox={`0 0 ${W} ${RH}`} className="viz-svg running-plot" role="img" aria-label="Running mean">
            <line x1={PAD} x2={W - 10} y1={ry(mu)} y2={ry(mu)} className="mean-true horizontal" />
            {runningPath && <path d={runningPath} className="running-path" />}
            <text x={PAD} y={RH - 3} className="tick">
              1 roll
            </text>
            <text x={W - 10} y={RH - 3} className="tick" textAnchor="end">
              {Math.max(1, history.length)} rolls{n > MAX_HISTORY ? ` (of ${n})` : ""}
            </text>
            <text x={W - 10} y={ry(mu) - 5} className="tick" textAnchor="end">
              E[X]
            </text>
          </svg>
        </div>
        <div className="viz-readout">
          <div className="readout-big">
            <span className="muted small">rolls</span> <strong>{n.toLocaleString()}</strong>
          </div>
          <div className="readout-row">
            <span className="swatch" style={{ background: "var(--viz-c)" }} />
            <Tex>{`\\mathbb{E}[X] = \\sum_i x_i\\,p_i = ${fmt(mu, 3)}`}</Tex>
          </div>
          <div className="readout-row">
            <span className="swatch" style={{ background: "var(--viz-b)" }} />
            <Tex>{`\\text{sample mean} = ${n ? fmt(sampleMean, 3) : "\\text{–}"}`}</Tex>
          </div>
          <div className="readout-row">
            <Tex>{`\\mathrm{Var}[X] = ${fmt(variance, 3)}, \\quad \\text{sample variance} = ${n ? fmt(sampleVar, 3) : "\\text{–}"}`}</Tex>
          </div>
          <div className="readout-row">
            <Tex>{`\\text{std} = \\sqrt{\\mathrm{Var}} = ${fmt(Math.sqrt(variance), 3)}`}</Tex>
          </div>
          <div className="readout-note">
            The orange line in the lower chart is the average of all rolls so far. It wanders at first, then hugs the
            expected value.
          </div>
        </div>
      </div>
    </Figure>
  );
}
