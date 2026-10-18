import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Tex } from "../components/RichText";
import { Arrow, ArrowDefs, Figure, clamp, fmt, linear, snap, useSvgDrag } from "./common";

type M = [number, number, number, number]; // [a, b, c, d] for [[a, b], [c, d]]

const PRESETS: { name: string; m: M }[] = [
  { name: "Identity", m: [1, 0, 0, 1] },
  { name: "Scale ×2", m: [2, 0, 0, 2] },
  { name: "Stretch x", m: [2, 0, 0, 1] },
  { name: "Rotate 90°", m: [0, -1, 1, 0] },
  { name: "Rotate 30°", m: [Math.cos(Math.PI / 6), -Math.sin(Math.PI / 6), Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)] },
  { name: "Shear", m: [1, 1, 0, 1] },
  { name: "Reflect", m: [-1, 0, 0, 1] },
  { name: "Squash", m: [1, 2, 0.5, 1] },
];

const SIZE = 400;
const R = 4;
// An "F" shape so you can see rotations and reflections.
const F_SHAPE: [number, number][] = [
  [0.2, 0.2], [0.45, 0.2], [0.45, 0.95], [0.85, 0.95], [0.85, 1.2], [0.45, 1.2], [0.45, 1.5],
  [0.95, 1.5], [0.95, 1.75], [0.2, 1.75],
];

function apply(m: M, x: number, y: number): [number, number] {
  return [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
}

function DragPoint({
  at,
  color,
  label,
  onMove,
  sx,
  sy,
}: {
  at: [number, number];
  color: string;
  label: string;
  onMove: (x: number, y: number) => void;
  sx: ReturnType<typeof linear>;
  sy: ReturnType<typeof linear>;
}) {
  const drag = useSvgDrag(useCallback((x: number, y: number) => onMove(sx.invert(x), sy.invert(y)), [onMove, sx, sy]));
  return (
    <g className="viz-handle" {...drag} role="slider" aria-label={`Drag ${label}`}>
      <circle cx={sx(at[0])} cy={sy(at[1])} r={16} className="hit" />
      <circle cx={sx(at[0])} cy={sy(at[1])} r={6} className="dot" style={{ fill: `var(--${color})` }} />
      <text x={sx(at[0]) + 9} y={sy(at[1]) - 9} className="viz-label" style={{ fill: `var(--${color})` }}>
        {label}
      </text>
    </g>
  );
}

export function MatrixTransformer({ showVector = true }: { showVector?: boolean }) {
  const id = useId().replace(/:/g, "");
  const [m, setM] = useState<M>([1, 1, 0, 1]);
  const [v, setV] = useState<[number, number]>([1, 1]);
  const anim = useRef<number | undefined>(undefined);

  const sx = linear(-R, R, 0, SIZE);
  const sy = linear(-R, R, SIZE, 0);

  useEffect(() => () => cancelAnimationFrame(anim.current ?? 0), []);

  function animateTo(target: M) {
    cancelAnimationFrame(anim.current ?? 0);
    const start = [...m] as M;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 600);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setM(start.map((s, i) => s + (target[i] - s) * e) as M);
      if (t < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  }

  const setCol = useCallback((col: 0 | 1, x: number, y: number) => {
    cancelAnimationFrame(anim.current ?? 0);
    const qx = snap(clamp(x, -R + 0.2, R - 0.2), 0.25);
    const qy = snap(clamp(y, -R + 0.2, R - 0.2), 0.25);
    setM((prev) => (col === 0 ? [qx, prev[1], qy, prev[3]] : [prev[0], qx, prev[2], qy]));
  }, []);
  const moveI = useCallback((x: number, y: number) => setCol(0, x, y), [setCol]);
  const moveJ = useCallback((x: number, y: number) => setCol(1, x, y), [setCol]);
  const moveV = useCallback(
    (x: number, y: number) => setV([snap(clamp(x, -3, 3), 0.25), snap(clamp(y, -3, 3), 0.25)]),
    [],
  );

  const det = m[0] * m[3] - m[1] * m[2];
  const lines: { p: [number, number]; q: [number, number] }[] = [];
  const L = 12;
  for (let k = -L; k <= L; k++) {
    lines.push({ p: apply(m, k, -L), q: apply(m, k, L) });
    lines.push({ p: apply(m, -L, k), q: apply(m, L, k) });
  }
  const square = [apply(m, 0, 0), apply(m, 1, 0), apply(m, 1, 1), apply(m, 0, 1)];
  const fPts = F_SHAPE.map(([x, y]) => apply(m, x, y));
  const iHat = apply(m, 1, 0);
  const jHat = apply(m, 0, 1);
  const mv = apply(m, v[0], v[1]);
  const pts = (ps: [number, number][]) => ps.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");

  return (
    <Figure
      title="A matrix moves every point in the plane"
      caption={
        <>
          Drag the tips of <span style={{ color: "var(--viz-a)" }}>î</span> and{" "}
          <span style={{ color: "var(--viz-b)" }}>ĵ</span>, or pick a preset. The matrix's columns are exactly where î
          and ĵ land, and every other point follows along. The shaded square's area scales by the determinant.
        </>
      }
      controls={
        <div className="preset-row">
          {PRESETS.map((p) => (
            <button key={p.name} className="btn btn-sm" onClick={() => animateTo(p.m)}>
              {p.name}
            </button>
          ))}
        </div>
      }
    >
      <div className="viz-split">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="viz-svg square" role="img" aria-label="Transformed grid">
          <ArrowDefs id={id} colors={["viz-a", "viz-b", "viz-e"]} />
          <defs>
            <clipPath id={`${id}-clip`}>
              <rect x={0} y={0} width={SIZE} height={SIZE} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-clip)`}>
            {/* original grid, faint */}
            {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map((k) => (
              <g key={k} className="viz-grid faint">
                <line x1={sx(k)} x2={sx(k)} y1={0} y2={SIZE} className={k === 0 ? "axis" : "gridline"} />
                <line y1={sy(k)} y2={sy(k)} x1={0} x2={SIZE} className={k === 0 ? "axis" : "gridline"} />
              </g>
            ))}
            {/* transformed grid */}
            {lines.map((l, i) => (
              <line key={i} x1={sx(l.p[0])} y1={sy(l.p[1])} x2={sx(l.q[0])} y2={sy(l.q[1])} className="viz-tgrid" />
            ))}
            <polygon points={pts(square)} className="viz-area" />
            <polygon points={pts(fPts)} className="viz-shape" />
          </g>
          <Arrow x1={sx(0)} y1={sy(0)} x2={sx(iHat[0])} y2={sy(iHat[1])} color="viz-a" markerId={id} width={3} />
          <Arrow x1={sx(0)} y1={sy(0)} x2={sx(jHat[0])} y2={sy(jHat[1])} color="viz-b" markerId={id} width={3} />
          {showVector && (
            <>
              <line x1={sx(0)} y1={sy(0)} x2={sx(v[0])} y2={sy(v[1])} className="viz-dashed" style={{ stroke: "var(--viz-e)" }} />
              <Arrow x1={sx(0)} y1={sy(0)} x2={sx(mv[0])} y2={sy(mv[1])} color="viz-e" markerId={id} width={2.5} />
              <circle cx={sx(mv[0])} cy={sy(mv[1])} r={3} style={{ fill: "var(--viz-e)" }} />
              <text x={sx(mv[0]) + 8} y={sy(mv[1]) + 16} className="viz-label" style={{ fill: "var(--viz-e)" }}>
                Mx
              </text>
            </>
          )}
          <DragPoint at={iHat} color="viz-a" label="î" onMove={moveI} sx={sx} sy={sy} />
          <DragPoint at={jHat} color="viz-b" label="ĵ" onMove={moveJ} sx={sx} sy={sy} />
          {showVector && <DragPoint at={v} color="viz-e" label="x" onMove={moveV} sx={sx} sy={sy} />}
        </svg>

        <div className="viz-readout">
          <div className="readout-big">
            <Tex>{`M = \\begin{bmatrix} \\htmlClass{tex-a}{${fmt(m[0], 2)}} & \\htmlClass{tex-b}{${fmt(m[1], 2)}} \\\\ \\htmlClass{tex-a}{${fmt(m[2], 2)}} & \\htmlClass{tex-b}{${fmt(m[3], 2)}} \\end{bmatrix}`}</Tex>
          </div>
          <div className="readout-row small muted">
            Column 1 = where î lands, column 2 = where ĵ lands.
          </div>
          {showVector && (
            <div className="readout-row">
              <Tex>{`M\\htmlClass{tex-e}{x} = ${fmt(v[0], 2)}\\begin{bmatrix}${fmt(m[0], 2)}\\\\${fmt(m[2], 2)}\\end{bmatrix} + ${fmt(v[1], 2)}\\begin{bmatrix}${fmt(m[1], 2)}\\\\${fmt(m[3], 2)}\\end{bmatrix} = \\begin{bmatrix}${fmt(mv[0], 2)}\\\\${fmt(mv[1], 2)}\\end{bmatrix}`}</Tex>
            </div>
          )}
          <div className="readout-row">
            <Tex>{`\\det M = ${fmt(m[0], 2)}\\cdot${fmt(m[3], 2)} - ${fmt(m[1], 2)}\\cdot${fmt(m[2], 2)} = ${fmt(det, 2)}`}</Tex>
          </div>
          <div className="readout-note">
            {Math.abs(det) < 1e-6
              ? "Determinant 0: the whole plane is squashed onto a line (or a point). Information is lost."
              : det < 0
                ? "Negative determinant: the plane has been flipped over (look at the F)."
                : `Areas are scaled by ${fmt(det, 2)}.`}
          </div>
        </div>
      </div>
    </Figure>
  );
}
