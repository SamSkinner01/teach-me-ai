import { useCallback, useId, useState } from "react";
import { Tex } from "../components/RichText";
import { Arrow, ArrowDefs, Figure, Grid, Slider, clamp, fmt, linear, snap, useSvgDrag } from "./common";

type Mode = "add" | "dot" | "scale";
type Vec = [number, number];

const SIZE = 400;
const R = 5;

function Handle({
  p,
  color,
  onMove,
  label,
  sx,
  sy,
}: {
  p: Vec;
  color: string;
  onMove: (v: Vec) => void;
  label: string;
  sx: ReturnType<typeof linear>;
  sy: ReturnType<typeof linear>;
}) {
  const drag = useSvgDrag(
    useCallback((x: number, y: number) => onMove([sx.invert(x), sy.invert(y)]), [onMove, sx, sy]),
  );
  return (
    <g className="viz-handle" {...drag} role="slider" aria-label={`Drag vector ${label}`} aria-valuetext={`(${fmt(p[0])}, ${fmt(p[1])})`}>
      <circle cx={sx(p[0])} cy={sy(p[1])} r={16} className="hit" />
      <circle cx={sx(p[0])} cy={sy(p[1])} r={6} style={{ fill: `var(--${color})` }} className="dot" />
      <text x={sx(p[0]) + 10} y={sy(p[1]) - 10} className="viz-label" style={{ fill: `var(--${color})` }}>
        {label}
      </text>
    </g>
  );
}

export function VectorPlayground({ mode = "add" }: { mode?: Mode }) {
  const id = useId().replace(/:/g, "");
  const [a, setA] = useState<Vec>([3, 1]);
  const [b, setB] = useState<Vec>(mode === "dot" ? [1, 3] : [1, 2]);
  const [s, setS] = useState(2);
  const [snapOn, setSnapOn] = useState(true);

  const sx = linear(-R, R, 0, SIZE);
  const sy = linear(-R, R, SIZE, 0);

  const fix = useCallback(
    (v: Vec): Vec => {
      const q: Vec = [clamp(v[0], -R + 0.2, R - 0.2), clamp(v[1], -R + 0.2, R - 0.2)];
      return snapOn ? [snap(q[0], 0.5), snap(q[1], 0.5)] : q;
    },
    [snapOn],
  );
  const moveA = useCallback((v: Vec) => setA(fix(v)), [fix]);
  const moveB = useCallback((v: Vec) => setB(fix(v)), [fix]);

  const O = [sx(0), sy(0)];
  const sum: Vec = [a[0] + b[0], a[1] + b[1]];
  const dot = a[0] * b[0] + a[1] * b[1];
  const na = Math.hypot(...a);
  const nb = Math.hypot(...b);
  const cos = na && nb ? dot / (na * nb) : 0;
  const theta = (Math.acos(clamp(cos, -1, 1)) * 180) / Math.PI;
  const projK = na ? dot / (na * na) : 0;
  const proj: Vec = [projK * a[0], projK * a[1]];
  const scaled: Vec = [s * a[0], s * a[1]];

  // Angle arc between a and b
  const angA = Math.atan2(a[1], a[0]);
  const angB = Math.atan2(b[1], b[0]);
  let delta = angB - angA;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const arcR = 0.9;
  const arcPts = Array.from({ length: 24 }, (_, i) => {
    const t = angA + (delta * i) / 23;
    return `${sx(arcR * Math.cos(t))},${sy(arcR * Math.sin(t))}`;
  }).join(" ");

  const dotClass = Math.abs(dot) < 1e-9 ? "zero" : dot > 0 ? "pos" : "neg";
  const title = mode === "add" ? "Adding vectors" : mode === "dot" ? "Dot product & projection" : "Scaling a vector";

  return (
    <Figure
      title={title}
      caption={
        mode === "add"
          ? "Drag the tips of a and b. a + b is where you end up if you walk along a, then along b."
          : mode === "dot"
            ? "Drag the tips. The dot product is positive when the vectors point the same way, zero when they're perpendicular, and negative when they point apart."
            : "Drag a's tip and move the slider. Negative scalars flip the arrow around."
      }
      controls={
        <>
          {mode === "scale" && <Slider label={<Tex>{"s"}</Tex>} value={s} min={-3} max={3} step={0.1} onChange={setS} />}
          <label className="check-toggle">
            <input type="checkbox" checked={snapOn} onChange={(e) => setSnapOn(e.target.checked)} /> Snap to grid
          </label>
        </>
      }
    >
      <div className="viz-split">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="viz-svg square" role="img" aria-label={title}>
          <ArrowDefs id={id} colors={["viz-a", "viz-b", "viz-c", "viz-d"]} />
          <Grid x={sx} y={sy} xmin={-R} xmax={R} ymin={-R} ymax={R} />

          {mode === "add" && (
            <>
              <line x1={sx(a[0])} y1={sy(a[1])} x2={sx(sum[0])} y2={sy(sum[1])} className="viz-dashed" style={{ stroke: "var(--viz-b)" }} />
              <line x1={sx(b[0])} y1={sy(b[1])} x2={sx(sum[0])} y2={sy(sum[1])} className="viz-dashed" style={{ stroke: "var(--viz-a)" }} />
              <Arrow x1={O[0]} y1={O[1]} x2={sx(sum[0])} y2={sy(sum[1])} color="viz-c" markerId={id} width={3} />
              <text x={sx(sum[0]) + 8} y={sy(sum[1]) + 16} className="viz-label" style={{ fill: "var(--viz-c)" }}>
                a + b
              </text>
            </>
          )}

          {mode === "dot" && (
            <>
              <line x1={sx(b[0])} y1={sy(b[1])} x2={sx(proj[0])} y2={sy(proj[1])} className="viz-dashed" style={{ stroke: "var(--viz-axis)" }} />
              <line
                x1={O[0]}
                y1={O[1]}
                x2={sx(proj[0])}
                y2={sy(proj[1])}
                style={{ stroke: "var(--viz-d)", strokeWidth: 7, opacity: 0.35 }}
                strokeLinecap="round"
              />
              {na > 0.1 && nb > 0.1 && <polyline points={arcPts} className="viz-arc" />}
            </>
          )}

          {mode === "scale" && (
            <>
              <Arrow x1={O[0]} y1={O[1]} x2={sx(scaled[0])} y2={sy(scaled[1])} color="viz-c" markerId={id} width={6} opacity={0.55} />
              <text x={sx(scaled[0]) + 8} y={sy(scaled[1]) + 16} className="viz-label" style={{ fill: "var(--viz-c)" }}>
                s·a
              </text>
            </>
          )}

          <Arrow x1={O[0]} y1={O[1]} x2={sx(a[0])} y2={sy(a[1])} color="viz-a" markerId={id} />
          {mode !== "scale" && <Arrow x1={O[0]} y1={O[1]} x2={sx(b[0])} y2={sy(b[1])} color="viz-b" markerId={id} />}
          <Handle p={a} color="viz-a" onMove={moveA} label="a" sx={sx} sy={sy} />
          {mode !== "scale" && <Handle p={b} color="viz-b" onMove={moveB} label="b" sx={sx} sy={sy} />}
        </svg>

        <div className="viz-readout">
          <div className="readout-row">
            <span className="swatch" style={{ background: "var(--viz-a)" }} />
            <Tex>{`a = (${fmt(a[0])},\\ ${fmt(a[1])})`}</Tex>
          </div>
          {mode !== "scale" && (
            <div className="readout-row">
              <span className="swatch" style={{ background: "var(--viz-b)" }} />
              <Tex>{`b = (${fmt(b[0])},\\ ${fmt(b[1])})`}</Tex>
            </div>
          )}
          {mode === "add" && (
            <div className="readout-row">
              <span className="swatch" style={{ background: "var(--viz-c)" }} />
              <Tex>{`a + b = (${fmt(a[0])} + ${fmt(b[0])},\\ ${fmt(a[1])} + ${fmt(b[1])}) = (${fmt(sum[0])},\\ ${fmt(sum[1])})`}</Tex>
            </div>
          )}
          {mode === "scale" && (
            <div className="readout-row">
              <span className="swatch" style={{ background: "var(--viz-c)" }} />
              <Tex>{`${fmt(s)}\\,a = (${fmt(scaled[0])},\\ ${fmt(scaled[1])})`}</Tex>
            </div>
          )}
          {mode === "dot" && (
            <>
              <div className={`readout-big dot-${dotClass}`}>
                <Tex>{`a \\cdot b = ${fmt(a[0])}\\cdot${fmt(b[0])} + ${fmt(a[1])}\\cdot${fmt(b[1])} = ${fmt(dot)}`}</Tex>
              </div>
              <div className="readout-row">
                <Tex>{`\\|a\\| = ${fmt(na)},\\quad \\|b\\| = ${fmt(nb)}`}</Tex>
              </div>
              <div className="readout-row">
                <Tex>{`\\theta = ${fmt(theta, 1)}^\\circ,\\quad \\cos\\theta = ${fmt(cos)}`}</Tex>
              </div>
              <div className="readout-row">
                <Tex>{`\\|a\\|\\,\\|b\\|\\cos\\theta = ${fmt(na * nb * cos)}`}</Tex>
              </div>
              <div className="readout-row small muted">
                <span className="swatch" style={{ background: "var(--viz-d)", opacity: 0.5 }} />
                shadow of b on a: {fmt(projK)} × a
              </div>
              <div className="readout-note">
                {dotClass === "pos" && "Positive: the vectors point roughly the same way."}
                {dotClass === "zero" && "Zero: the vectors are perpendicular."}
                {dotClass === "neg" && "Negative: the vectors point roughly opposite ways."}
              </div>
            </>
          )}
          {mode !== "dot" && (
            <div className="readout-row">
              <Tex>{`\\|a\\| = \\sqrt{${fmt(a[0])}^2 + ${fmt(a[1])}^2} = ${fmt(na)}`}</Tex>
            </div>
          )}
        </div>
      </div>
    </Figure>
  );
}
