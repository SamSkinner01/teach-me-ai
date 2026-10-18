import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { Tex } from "../components/RichText";
import { Figure, Segmented, linear } from "./common";
import { bits32, xorshift32 } from "./random";

const OPS = [
  { text: "x ^= x << 13", shift: 13, left: true },
  { text: "x ^= x >> 17", shift: 17, left: false },
  { text: "x ^= x << 5", shift: 5, left: true },
];

function BitRow({ label, value, fresh, dropped, hot }: { label: string; value: number; fresh?: Set<number>; dropped?: number[]; hot?: boolean }) {
  const bits = bits32(value);
  return (
    <div className={`bit-row ${hot ? "hot" : ""}`}>
      <span className="bit-label mono">{label}</span>
      <span className="bit-dropped" aria-hidden={!dropped?.length}>
        {dropped?.map((b, i) => (
          <span key={i} className={`bit dropped b${b}`}>
            {b}
          </span>
        ))}
      </span>
      <span className="bits">
        {bits.map((b, i) => (
          <span key={i} className={`bit b${b} ${fresh?.has(i) ? "fresh" : ""} ${i % 8 === 0 && i ? "byte" : ""}`}>
            {b}
          </span>
        ))}
      </span>
      <span className="bit-value mono">{value >>> 0}</span>
    </div>
  );
}

export function XorshiftViz() {
  const [seedText, setSeedText] = useState("2463534242");
  const [x, setX] = useState(2463534242);
  const [phase, setPhase] = useState(0);
  const [outputs, setOutputs] = useState<number[]>([]);

  const op = OPS[phase];
  const shifted = (op.left ? x << op.shift : x >>> op.shift) >>> 0;
  const result = (x ^ shifted) >>> 0;
  const fresh = new Set(op.left ? Array.from({ length: op.shift }, (_, i) => 31 - i) : Array.from({ length: op.shift }, (_, i) => i));
  const dropped = op.left ? bits32(x).slice(0, op.shift) : [];

  function apply() {
    setX(result);
    if (phase === 2) {
      setOutputs((o) => [result, ...o].slice(0, 6));
      setPhase(0);
    } else setPhase(phase + 1);
  }

  function nextNumber() {
    let v = x;
    for (let k = phase; k < 3; k++) {
      const s = (OPS[k].left ? v << OPS[k].shift : v >>> OPS[k].shift) >>> 0;
      v = (v ^ s) >>> 0;
    }
    setX(v);
    setPhase(0);
    setOutputs((o) => [v, ...o].slice(0, 6));
  }

  function reset() {
    const n = Number(seedText);
    const seed = Number.isInteger(n) && n >= 1 && n <= 4294967295 ? n : 2463534242;
    setSeedText(String(seed));
    setX(seed);
    setPhase(0);
    setOutputs([]);
  }

  return (
    <Figure
      title="Inside xorshift32"
      caption="Each step shifts the 32 bits left or right and XORs the shifted copy back in. Shifting left pushes bits off the top: they're dropped, because the number only has 32 bits. Three of these steps scramble the bits thoroughly, yet the whole thing is deterministic: the same seed always gives the same sequence."
      controls={
        <div className="preset-row">
          <label className="small muted" htmlFor="xs-seed">
            seed
          </label>
          <input
            id="xs-seed"
            className="input seed-input mono"
            value={seedText}
            inputMode="numeric"
            onChange={(e) => setSeedText(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && reset()}
          />
          <button className="btn btn-sm" onClick={reset}>
            <Icon name="reset" size={14} /> Use seed
          </button>
          <button className="btn btn-sm btn-primary" onClick={apply}>
            Apply step {phase + 1} of 3
          </button>
          <button className="btn btn-sm" onClick={nextNumber}>
            Next number <Icon name="chevronRight" size={14} />
          </button>
        </div>
      }
    >
      <div className="xs-op mono">
        step {phase + 1}: <strong>{op.text}</strong>
      </div>
      <div className="bit-rows" aria-live="polite">
        <BitRow label="x" value={x} />
        <BitRow label={op.left ? `x << ${op.shift}` : `x >> ${op.shift}`} value={shifted} fresh={fresh} dropped={dropped} />
        <BitRow label="x ^ that" value={result} hot />
      </div>
      <div className="xs-legend small muted">
        <span className="bit b1">1</span> one bit · <span className="bit b0">0</span> zero bit ·{" "}
        <span className="bit b0 fresh">0</span> shifted in · <span className="bit dropped b1">1</span> shifted out and
        dropped. XOR gives 1 where the two rows differ.
      </div>
      <div className="xs-outputs">
        <span className="small muted">outputs so far (newest first):</span>
        {outputs.length === 0 ? (
          <span className="small muted">none yet</span>
        ) : (
          outputs.map((o, i) => (
            <span key={i} className="xs-out mono">
              {o} → <Tex>{`${(o / 4294967296).toFixed(4)}`}</Tex>
            </span>
          ))
        )}
      </div>
    </Figure>
  );
}

const PAIRS = 2500;

function generate(kind: string, count: number): number[] {
  const out: number[] = [];
  if (kind === "xorshift") {
    let s = 2463534242;
    for (let i = 0; i < count; i++) {
      s = xorshift32(s);
      out.push(s / 4294967296);
    }
  } else {
    // A deliberately bad linear congruential generator with a tiny modulus.
    let s = 1;
    for (let i = 0; i < count; i++) {
      s = (37 * s + 1) % 1024;
      out.push(s / 1024);
    }
  }
  return out;
}

export function RngQuality() {
  const [kind, setKind] = useState("xorshift");
  const u = useMemo(() => generate(kind, 20000), [kind]);
  const S = 300;
  const sx = linear(0, 1, 6, S - 6);
  const sy = linear(0, 1, S - 6, 6);
  const bins = new Array(20).fill(0);
  for (const v of u) bins[Math.min(19, Math.floor(v * 20))]++;
  const bmax = Math.max(...bins);
  const HW = 300;
  const HH = 140;

  return (
    <Figure
      title="Is it random enough?"
      caption="Left: consecutive pairs (uᵢ, uᵢ₊₁) plotted as points. A good generator fills the square evenly with no visible pattern. Right: a histogram of 20,000 numbers, which should be flat. The bad generator passes the histogram test but fails the pairs test badly: its points fall on a few straight lines."
      controls={
        <Segmented
          label="Generator"
          value={kind}
          onChange={setKind}
          options={[
            { value: "xorshift", label: "xorshift32" },
            { value: "bad", label: "bad: x ← (37x + 1) mod 1024" },
          ]}
        />
      }
    >
      <div className="rng-grid">
        <svg viewBox={`0 0 ${S} ${S}`} className="viz-svg square rng-scatter" role="img" aria-label="Scatter of consecutive pairs">
          {Array.from({ length: PAIRS }, (_, i) => (
            <circle key={i} cx={sx(u[2 * i])} cy={sy(u[2 * i + 1])} r={1.3} className="rng-dot" />
          ))}
        </svg>
        <svg viewBox={`0 0 ${HW} ${HH}`} className="viz-svg rng-hist" role="img" aria-label="Histogram">
          {bins.map((c, i) => {
            const h = (c / bmax) * (HH - 24);
            return <rect key={i} x={6 + i * ((HW - 12) / 20)} y={HH - 16 - h} width={(HW - 12) / 20 - 2} height={h} className="bar-obs" />;
          })}
          <text x={6} y={HH - 3} className="tick">
            0
          </text>
          <text x={HW - 6} y={HH - 3} className="tick" textAnchor="end">
            1
          </text>
        </svg>
      </div>
    </Figure>
  );
}
