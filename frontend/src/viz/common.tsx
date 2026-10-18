import { useCallback, useRef, type PointerEvent as RPointerEvent, type ReactNode } from "react";

export function Figure({
  title,
  caption,
  children,
  controls,
  className = "",
}: {
  title: string;
  caption?: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`viz card ${className}`}>
      <div className="viz-head">
        <span className="viz-kicker">Interactive</span>
        <span className="viz-title">{title}</span>
      </div>
      {controls && <div className="viz-controls">{controls}</div>}
      <div className="viz-body">{children}</div>
      {caption && <figcaption className="viz-caption">{caption}</figcaption>}
    </figure>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  width,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  width?: number;
}) {
  return (
    <label className="slider" style={width ? { width } : undefined}>
      <span className="slider-label">
        {label} <span className="slider-value">{format ? format(value) : fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Format a number for readouts: up to 3 decimals, no trailing zeros, real minus sign. */
export function fmt(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "NaN";
  const r = Number(x.toFixed(digits));
  const s = (Object.is(r, -0) ? 0 : r).toString();
  return s.replace("-", "−");
}

/** Linear map between a math domain and pixel range. */
export function linear(d0: number, d1: number, r0: number, r1: number) {
  const k = (r1 - r0) / (d1 - d0);
  const f = (x: number) => r0 + (x - d0) * k;
  f.invert = (p: number) => d0 + (p - r0) / k;
  return f as ((x: number) => number) & { invert: (p: number) => number };
}

/**
 * Pointer dragging inside an SVG. `onDrag` receives SVG user-space coordinates.
 * Attach the returned handlers to the draggable element.
 */
export function useSvgDrag(onDrag: (x: number, y: number) => void, onEnd?: () => void) {
  const dragging = useRef(false);
  const toUser = (e: RPointerEvent<Element>) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : pt;
  };
  const onPointerDown = useCallback(
    (e: RPointerEvent<Element>) => {
      dragging.current = true;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      const p = toUser(e);
      onDrag(p.x, p.y);
      e.preventDefault();
    },
    [onDrag],
  );
  const onPointerMove = useCallback(
    (e: RPointerEvent<Element>) => {
      if (!dragging.current) return;
      const p = toUser(e);
      onDrag(p.x, p.y);
    },
    [onDrag],
  );
  const onPointerUp = useCallback(
    (e: RPointerEvent<Element>) => {
      dragging.current = false;
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      onEnd?.();
    },
    [onEnd],
  );
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

/** Arrowhead markers, one per colour variable. Put once inside an <svg>. */
export function ArrowDefs({ id, colors }: { id: string; colors: string[] }) {
  return (
    <defs>
      {colors.map((c) => (
        <marker
          key={c}
          id={`${id}-${c}`}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: `var(--${c})` }} />
        </marker>
      ))}
    </defs>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  markerId,
  width = 2.5,
  dashed = false,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  markerId: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      style={{ stroke: `var(--${color})`, strokeWidth: width, opacity }}
      strokeDasharray={dashed ? "6 5" : undefined}
      strokeLinecap="round"
      markerEnd={`url(#${markerId}-${color})`}
    />
  );
}

/** Grid lines and axes for a square math window. */
export function Grid({
  x,
  y,
  xmin,
  xmax,
  ymin,
  ymax,
  step = 1,
  labels = true,
}: {
  x: (v: number) => number;
  y: (v: number) => number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  step?: number;
  labels?: boolean;
}) {
  const xs: number[] = [];
  for (let v = Math.ceil(xmin / step) * step; v <= xmax + 1e-9; v += step) xs.push(Number(v.toFixed(6)));
  const ys: number[] = [];
  for (let v = Math.ceil(ymin / step) * step; v <= ymax + 1e-9; v += step) ys.push(Number(v.toFixed(6)));
  return (
    <g className="viz-grid">
      {xs.map((v) => (
        <line key={`x${v}`} x1={x(v)} x2={x(v)} y1={y(ymin)} y2={y(ymax)} className={v === 0 ? "axis" : "gridline"} />
      ))}
      {ys.map((v) => (
        <line key={`y${v}`} y1={y(v)} y2={y(v)} x1={x(xmin)} x2={x(xmax)} className={v === 0 ? "axis" : "gridline"} />
      ))}
      {labels &&
        xs
          .filter((v) => v !== 0 && Number.isInteger(v))
          .map((v) => (
            <text key={`lx${v}`} x={x(v)} y={y(0) + 14} className="tick" textAnchor="middle">
              {fmt(v)}
            </text>
          ))}
      {labels &&
        ys
          .filter((v) => v !== 0 && Number.isInteger(v))
          .map((v) => (
            <text key={`ly${v}`} x={x(0) - 6} y={y(v) + 4} className="tick" textAnchor="end">
              {fmt(v)}
            </text>
          ))}
    </g>
  );
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function snap(v: number, step: number) {
  return Math.round(v / step) * step;
}
