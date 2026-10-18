import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { Icon } from "../components/Icon";
import { ArrayCanvas } from "./CnnViz";
import { Figure } from "./common";

// Browse the real MNIST test set and see each image as the bytes stored in the file.

const COUNT = 10000;

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function DatasetViewer() {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("0");
  const [image, setImage] = useState<{ index: number; pixels: Uint8Array; label: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api.mnistImages([index]).then(
      (r) => !cancelled && setImage({ index, pixels: decode(r.images[String(index)]), label: r.labels[String(index)] }),
      (e) => !cancelled && setError(e instanceof ApiError ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [index]);

  const go = (i: number) => {
    const next = ((i % COUNT) + COUNT) % COUNT;
    setIndex(next);
    setDraft(String(next));
  };

  const px = image?.pixels;
  const row = hover === null ? null : Math.floor(hover / 28);
  const col = hover === null ? null : hover % 28;

  return (
    <Figure
      title="The MNIST test set, byte by byte"
      className="dataset-viewer"
      caption="Every image is 784 bytes in the file, one per pixel, row by row (0 = blank, 255 = full ink). Hover over the numbers to see where each one sits in the file. Its label is a single byte in the separate labels file."
      controls={
        <div className="dv-nav">
          <button className="btn btn-sm" onClick={() => go(index - 1)} aria-label="Previous image">
            <Icon name="chevronLeft" size={14} />
          </button>
          <label className="dv-index">
            <span className="small muted">image</span>
            <input
              className="input"
              type="number"
              min={0}
              max={COUNT - 1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => go(Math.floor(Number(draft) || 0))}
              onKeyDown={(e) => e.key === "Enter" && go(Math.floor(Number(draft) || 0))}
            />
            <span className="small muted">of 10,000</span>
          </label>
          <button className="btn btn-sm" onClick={() => go(index + 1)} aria-label="Next image">
            <Icon name="chevronRight" size={14} />
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => go(Math.floor(Math.random() * COUNT))}>
            Random
          </button>
        </div>
      }
    >
      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : !px || !image ? (
        <div className="muted">
          <span className="spinner" /> Loading…
        </div>
      ) : (
        <div className="dv-body">
          <div className="dv-side">
            <ArrayCanvas
              data={{ h: 28, w: 28, values: px }}
              size={168}
              className="dv-image"
              label={`Test image ${index}`}
            />
            <div className="dv-facts">
              <div>
                label <strong className="mono dv-label">{image.label}</strong>
              </div>
              <div className="small muted">
                pixels start at byte <span className="mono">{(16 + 784 * image.index).toLocaleString()}</span> of the
                images file; the label is byte <span className="mono">{(8 + image.index).toLocaleString()}</span> of the
                labels file
              </div>
              <div className="small dv-hover">
                {hover === null ? (
                  <span className="muted">Hover over a number…</span>
                ) : (
                  <>
                    row {row}, column {col}: byte <strong className="mono">{px[hover]}</strong> at offset{" "}
                    <span className="mono">{(16 + 784 * image.index + hover).toLocaleString()}</span> ={" "}
                    <span className="mono">{(px[hover] / 255).toFixed(3)}</span> after ÷ 255
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="dv-grid-wrap">
            <div className="dv-grid" onMouseLeave={() => setHover(null)} role="img" aria-label="Pixel values">
              {Array.from(px, (v, i) => (
                <span
                  key={i}
                  className={`dv-cell ${v === 0 ? "zero" : ""} ${i === hover ? "on" : ""}`}
                  style={
                    v
                      ? {
                          background: `color-mix(in srgb, var(--text) ${Math.round((v / 255) * 85)}%, var(--surface))`,
                          color: v > 128 ? "var(--surface)" : undefined,
                        }
                      : undefined
                  }
                  onMouseEnter={() => setHover(i)}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Figure>
  );
}
