import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Tex } from "../components/RichText";
import { cssRgb, useTheme } from "../state/theme";
import { Arrow, ArrowDefs, Figure, Segmented, Slider, clamp, fmt, linear, useSvgDrag } from "./common";

interface Surface {
  label: string;
  tex: string;
  f: (x: number, y: number) => number;
  start: [number, number];
  rate: number;
}

const SURFACES: Record<string, Surface> = {
  bowl: {
    label: "Bowl",
    tex: "f(x, y) = (x-1)^2 + 2(y+2)^2",
    f: (x, y) => (x - 1) ** 2 + 2 * (y + 2) ** 2,
    start: [-2.5, 2],
    rate: 0.1,
  },
  valley: {
    label: "Narrow valley",
    tex: "f(x, y) = 0.3x^2 + 6y^2",
    f: (x, y) => 0.3 * x * x + 6 * y * y,
    start: [-3.5, 1.5],
    rate: 0.08,
  },
  saddle: {
    label: "Saddle",
    tex: "f(x, y) = x^2 - y^2",
    f: (x, y) => x * x - y * y,
    start: [2.5, 0.3],
    rate: 0.1,
  },
  hills: {
    label: "Hills",
    tex: "f(x, y) = \\sin x \\cos y + 0.1(x^2 + y^2)",
    f: (x, y) => Math.sin(x) * Math.cos(y) + 0.1 * (x * x + y * y),
    start: [1.2, 0.8],
    rate: 0.3,
  },
};

const SIZE = 420;
const R = 4;
const RES = 220;

function grad(f: Surface["f"], x: number, y: number): [number, number] {
  const h = 1e-4;
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
}


export function GradientField({ surface: initial = "bowl", descent = true }: { surface?: keyof typeof SURFACES; descent?: boolean }) {
  const id = useId().replace(/:/g, "");
  const { theme } = useTheme();
  const [key, setKey] = useState<string>(initial);
  const S = SURFACES[key];
  const [p, setP] = useState<[number, number]>(S.start);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [rate, setRate] = useState(S.rate);
  const [showParts, setShowParts] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);

  const [sx] = useState(() => linear(-R, R, 0, SIZE));
  const [sy] = useState(() => linear(-R, R, SIZE, 0));

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const lowC = cssRgb("--surface");
    const highC = cssRgb("--accent");
    const vals = new Float64Array(RES * RES);
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        const x = -R + (2 * R * (i + 0.5)) / RES;
        const y = R - (2 * R * (j + 0.5)) / RES;
        const v = S.f(x, y);
        vals[j * RES + i] = v;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    const levels = 14;
    // Compress the range so steep surfaces still show detail near the minimum.
    const norm = (v: number) => Math.sqrt((v - lo) / (hi - lo || 1));
    const img = ctx.createImageData(RES, RES);
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        const t = norm(vals[j * RES + i]);
        const band = Math.floor(t * levels);
        const right = i + 1 < RES ? Math.floor(norm(vals[j * RES + i + 1]) * levels) : band;
        const down = j + 1 < RES ? Math.floor(norm(vals[(j + 1) * RES + i]) * levels) : band;
        // Higher values get more of the accent colour (darker in light mode).
        const q = band / levels;
        const mix = 0.05 + 0.6 * q;
        const edge = band !== right || band !== down;
        const o = (j * RES + i) * 4;
        for (let c = 0; c < 3; c++) {
          const base = lowC[c] * (1 - mix) + highC[c] * mix;
          img.data[o + c] = edge ? base * 0.82 : base;
        }
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [S, theme]);

  const move = useCallback(
    (px: number, py: number) => {
      setP([clamp(sx.invert(px), -R + 0.1, R - 0.1), clamp(sy.invert(py), -R + 0.1, R - 0.1)]);
      setTrail([]);
    },
    [sx, sy],
  );
  const drag = useSvgDrag(move);

  const [gx, gy] = grad(S.f, p[0], p[1]);
  const gnorm = Math.hypot(gx, gy);
  const maxLen = 1.6;
  const scale = gnorm > maxLen ? maxLen / gnorm : 1;

  function stepDown() {
    const nx = clamp(p[0] - rate * gx, -R, R);
    const ny = clamp(p[1] - rate * gy, -R, R);
    setTrail((t) => [...t, p].slice(-60));
    setP([nx, ny]);
  }

  function changeSurface(k: string) {
    setKey(k);
    setP(SURFACES[k].start);
    setRate(SURFACES[k].rate);
    setTrail([]);
  }

  return (
    <Figure
      title="The gradient points uphill"
      caption={
        <>
          Darker bands are higher. Drag the point anywhere. The <span style={{ color: "var(--viz-b)" }}>gradient</span>{" "}
          is made of the two partial derivatives and always crosses the contour lines at right angles, pointing straight
          uphill. {descent && "Stepping the other way, downhill, is gradient descent: the way networks learn."}
        </>
      }
      controls={
        <>
          <Segmented
            label="Surface"
            value={key}
            onChange={changeSurface}
            options={Object.entries(SURFACES).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <label className="check-toggle">
            <input type="checkbox" checked={showParts} onChange={(e) => setShowParts(e.target.checked)} /> Show ∂f/∂x and ∂f/∂y
          </label>
        </>
      }
    >
      <div className="viz-split">
        <div className="gf-stage">
          <canvas ref={canvas} width={RES} height={RES} className="gf-canvas" aria-hidden="true" />
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="viz-svg square gf-overlay" role="img" aria-label="Contour plot" {...drag}>
            <ArrowDefs id={id} colors={["viz-b", "viz-c", "viz-a", "viz-d"]} />
            <line x1={sx(-R)} x2={sx(R)} y1={sy(0)} y2={sy(0)} className="viz-axisline faint" />
            <line y1={sy(-R)} y2={sy(R)} x1={sx(0)} x2={sx(0)} className="viz-axisline faint" />
            {trail.length > 0 && (
              <polyline points={[...trail, p].map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")} className="gf-trail" />
            )}
            {trail.map(([x, y], i) => (
              <circle key={i} cx={sx(x)} cy={sy(y)} r={2.5} className="gf-trail-dot" />
            ))}
            {showParts && (
              <>
                <Arrow x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[0] + gx * scale)} y2={sy(p[1])} color="viz-a" markerId={id} width={2} />
                <Arrow x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[0])} y2={sy(p[1] + gy * scale)} color="viz-d" markerId={id} width={2} />
              </>
            )}
            <Arrow x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[0] + gx * scale)} y2={sy(p[1] + gy * scale)} color="viz-b" markerId={id} width={3} />
            {descent && (
              <Arrow
                x1={sx(p[0])}
                y1={sy(p[1])}
                x2={sx(p[0] - gx * scale * 0.7)}
                y2={sy(p[1] - gy * scale * 0.7)}
                color="viz-c"
                markerId={id}
                width={2.5}
                dashed
              />
            )}
            <circle cx={sx(p[0])} cy={sy(p[1])} r={7} className="viz-point" />
          </svg>
        </div>
        <div className="viz-readout">
          <div className="readout-row">
            <Tex>{S.tex}</Tex>
          </div>
          <div className="readout-row">
            <Tex>{`(x, y) = (${fmt(p[0], 2)},\\ ${fmt(p[1], 2)}),\\quad f = ${fmt(S.f(p[0], p[1]), 3)}`}</Tex>
          </div>
          <div className="readout-big">
            <Tex>{`\\nabla f = \\begin{bmatrix} \\htmlClass{tex-a}{\\partial f/\\partial x} \\\\ \\htmlClass{tex-d}{\\partial f/\\partial y} \\end{bmatrix} = \\begin{bmatrix} ${fmt(gx, 3)} \\\\ ${fmt(gy, 3)} \\end{bmatrix}`}</Tex>
          </div>
          <div className="readout-row">
            <Tex>{`\\|\\nabla f\\| = ${fmt(gnorm, 3)}`}</Tex>
            <span className="small muted"> (steepness)</span>
          </div>
          {descent && (
            <>
              <Slider label="step size η" value={rate} min={0.01} max={0.6} step={0.01} onChange={setRate} />
              <div className="preset-row">
                <button className="btn btn-sm btn-primary" onClick={stepDown}>
                  <Icon name="arrowRight" size={14} /> Step downhill
                </button>
                <button className="btn btn-sm" onClick={() => setTrail([])} disabled={trail.length === 0}>
                  Clear trail
                </button>
              </div>
              <div className="small muted">
                <Tex>{`(x, y) \\leftarrow (x, y) - \\eta\\,\\nabla f`}</Tex>. Try a big step size on the narrow valley.
              </div>
            </>
          )}
        </div>
      </div>
    </Figure>
  );
}
