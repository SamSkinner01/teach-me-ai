import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type RunSummary } from "../api";
import { useSession } from "../state/session";
import { ArrayCanvas } from "./CnnViz";
import { loadModel, predict, type Model } from "./cnn";
import { Figure, Segmented } from "./common";
import { DigitDemo, getModel } from "./DigitDemo";

// Figures for the capstone's last lessons. They show the learner's own trained network.

const EXERCISE = "cap-train";
const GALLERY = 32;

function percent(x: number, digits = 1) {
  return `${(x * 100).toFixed(digits)}%`;
}

function runLabel(r: RunSummary) {
  return `${percent(r.accuracy ?? 0)} · ${r.params.train_limit.toLocaleString()} images × ${r.params.epochs} · ${new Date(
    r.created_at,
  ).toLocaleDateString()}`;
}

/** The learner's finished runs (best first). */
function useFinishedRuns(needModel: boolean) {
  const { language } = useSession();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setRuns(null);
    setError(null);
    api.trainingOverview(EXERCISE).then(
      (ov) => {
        if (cancelled) return;
        const done = ov.runs.filter(
          (r) => r.status === "succeeded" && r.accuracy !== null && (!needModel || r.has_model),
        );
        setRuns(done.sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0) || b.id - a.id));
      },
      (e) => !cancelled && setError(e instanceof ApiError ? e.message : String(e)),
    );
    return () => {
      cancelled = true;
    };
  }, [language, needModel]);
  return { runs, error };
}

function RunPicker({ runs, value, onChange }: { runs: RunSummary[]; value: number; onChange: (id: number) => void }) {
  if (runs.length < 2) return null;
  return (
    <label className="field run-picker">
      <span className="small muted">Run</span>
      <select className="input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {runs.map((r) => (
          <option key={r.id} value={r.id}>
            {runLabel(r)}
          </option>
        ))}
      </select>
    </label>
  );
}

function NoRunYet({ what }: { what: string }) {
  return (
    <div className="alert alert-info">
      This figure shows {what}, so it needs a finished training run first. Train one in{" "}
      <Link to="/learn/training-cnn">Training your CNN</Link>.
    </div>
  );
}

function decodePixels(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------------------------------------------------------------------------
// Confusion matrix + gallery of the actual test images in each cell
// ---------------------------------------------------------------------------

export function ConfusionMatrixViz() {
  const { runs, error } = useFinishedRuns(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [data, setData] = useState<{ predicted: number[]; actual: number[] } | null>(null);
  const [cell, setCell] = useState<[number, number] | null>(null);
  const [images, setImages] = useState<Record<string, Uint8Array>>({});
  const [model, setModel] = useState<Model | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selected = runs?.find((r) => r.id === runId) ?? runs?.[0];

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setData(null);
    setModel(null);
    setPicked(null);
    setLoadError(null);
    api.trainingPredictions(selected.id).then(
      (d) => !cancelled && setData(d),
      (e) => !cancelled && setLoadError(e instanceof ApiError ? e.message : String(e)),
    );
    if (selected.has_model) {
      api
        .trainingModel(selected.id)
        .then(loadModel)
        .then(
          (m) => !cancelled && setModel(m),
          () => undefined,
        );
    }
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const matrix = useMemo(() => {
    if (!data) return null;
    const m = Array.from({ length: 10 }, () => new Array<number>(10).fill(0));
    data.actual.forEach((a, i) => {
      const p = data.predicted[i];
      if (a >= 0 && a < 10 && p >= 0 && p < 10) m[a][p] += 1;
    });
    return m;
  }, [data]);

  // Start on the most common mistake, the most interesting cell.
  useEffect(() => {
    if (!matrix) return;
    let best: [number, number] = [0, 0];
    let count = -1;
    for (let a = 0; a < 10; a++)
      for (let p = 0; p < 10; p++)
        if (a !== p && matrix[a][p] > count) {
          count = matrix[a][p];
          best = [a, p];
        }
    setCell(best);
  }, [matrix]);

  const members = useMemo(() => {
    if (!data || !cell) return [];
    const out: number[] = [];
    for (let i = 0; i < data.actual.length && out.length < GALLERY; i++)
      if (data.actual[i] === cell[0] && data.predicted[i] === cell[1]) out.push(i);
    return out;
  }, [data, cell]);

  useEffect(() => {
    const missing = members.filter((i) => !(String(i) in images));
    if (!missing.length) return;
    let cancelled = false;
    api.mnistImages(missing).then(
      (r) =>
        !cancelled &&
        setImages((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(r.images)) next[k] = decodePixels(v);
          return next;
        }),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [members, images]);

  useEffect(() => setPicked(members[0] ?? null), [members]);

  const pickedProbs = useMemo(() => {
    const px = picked !== null ? images[String(picked)] : undefined;
    if (!model || !px) return null;
    const input = new Float32Array(784);
    for (let i = 0; i < 784; i++) input[i] = (px[i] / 255 - model.mean) / model.std;
    return predict(model, { shape: [1, 28, 28], data: input }).probs;
  }, [model, picked, images]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (runs === null)
    return (
      <div className="muted">
        <span className="spinner" /> Loading your runs…
      </div>
    );
  if (!selected) return <NoRunYet what="your own network's mistakes" />;

  const rowTotals = matrix?.map((row) => row.reduce((a, b) => a + b, 0)) ?? [];
  const total = rowTotals.reduce((a, b) => a + b, 0);
  const correct = matrix ? matrix.reduce((s, row, i) => s + row[i], 0) : 0;
  const recalls = matrix?.map((row, i) => (rowTotals[i] ? row[i] / rowTotals[i] : 0)) ?? [];
  const worst = recalls.length ? recalls.indexOf(Math.min(...recalls)) : null;

  return (
    <Figure
      title="Your network's confusion matrix"
      className="cm-figure"
      caption="Each row is the true digit and each column is the digit your network predicted, counted over the test set. The diagonal holds the correct answers and everything off it is a mistake. Click any cell to see the actual images that landed there."
      controls={<RunPicker runs={runs} value={selected.id} onChange={setRunId} />}
    >
      {loadError ? (
        <div className="alert alert-error">{loadError}</div>
      ) : !matrix ? (
        <div className="muted">
          <span className="spinner" /> Loading predictions…
        </div>
      ) : (
        <div className="cm-layout">
          <div className="cm-wrap">
            <div className="cm-axis-top small muted">predicted →</div>
            <div className="cm-grid" role="grid" aria-label="Confusion matrix">
              <span className="cm-corner small muted">true ↓</span>
              {matrix.map((_, p) => (
                <span key={`h${p}`} className="cm-head mono">
                  {p}
                </span>
              ))}
              {matrix.map((row, a) => (
                <div key={a} className="cm-row" role="row">
                  <span className="cm-head mono">{a}</span>
                  {row.map((n, p) => {
                    const share = rowTotals[a] ? n / rowTotals[a] : 0;
                    const strength = a === p ? 12 + share * 70 : n === 0 ? 0 : Math.min(80, 12 + share * 400);
                    const color = a === p ? "var(--viz-c)" : "var(--viz-b)";
                    const on = cell !== null && cell[0] === a && cell[1] === p;
                    return (
                      <button
                        key={p}
                        role="gridcell"
                        className={`cm-cell ${on ? "on" : ""} ${n === 0 ? "zero" : ""}`}
                        style={{ background: `color-mix(in srgb, ${color} ${strength.toFixed(0)}%, var(--surface))` }}
                        onClick={() => setCell([a, p])}
                        aria-label={`${n} images of a ${a} predicted as ${p}`}
                        title={`true ${a}, predicted ${p}: ${n}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="small muted cm-total">
              {correct.toLocaleString()} of {total.toLocaleString()} correct ({percent(correct / total, 2)})
            </div>
          </div>

          <div className="viz-readout cm-side">
            <div className="cm-recall" aria-label="Accuracy for each digit">
              {recalls.map((r, d) => (
                <div key={d} className={`cm-recall-row ${d === worst ? "worst" : ""}`}>
                  <span className="mono">{d}</span>
                  <span className="dd-track">
                    <span style={{ width: `${(r * 100).toFixed(1)}%` }} />
                  </span>
                  <span className="mono small">{percent(r)}</span>
                </div>
              ))}
            </div>
            {worst !== null && (
              <div className="readout-note">
                Your network is weakest on <strong>{worst}</strong>s ({percent(recalls[worst])} right). Row {worst}{" "}
                shows what it mistakes them for.
              </div>
            )}
          </div>

          {cell && (
            <div className="cm-gallery">
              <div className="cm-gallery-head">
                <strong>
                  {cell[0] === cell[1]
                    ? `${matrix[cell[0]][cell[1]]} correctly classified ${cell[0]}s`
                    : `${matrix[cell[0]][cell[1]]} images of a ${cell[0]} that your network called a ${cell[1]}`}
                </strong>
                {matrix[cell[0]][cell[1]] > GALLERY && (
                  <span className="small muted"> (showing the first {GALLERY})</span>
                )}
              </div>
              {members.length === 0 ? (
                <div className="small muted">None, nothing to see here.</div>
              ) : (
                <div className="cm-gallery-body">
                  <div className="cm-thumbs">
                    {members.map((i) => {
                      const px = images[String(i)];
                      return (
                        <button
                          key={i}
                          className={`cm-thumb ${picked === i ? "on" : ""}`}
                          onClick={() => setPicked(i)}
                          aria-label={`Test image ${i}`}
                          title={`test image #${i}`}
                        >
                          {px ? <ArrayCanvas data={{ h: 28, w: 28, values: px }} /> : <span className="spinner" />}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && pickedProbs && (
                    <div className="cm-probs">
                      <div className="small muted">How sure your network was about #{picked}</div>
                      {pickedProbs
                        .map((p, d) => [p, d] as const)
                        .sort((x, y) => y[0] - x[0])
                        .slice(0, 3)
                        .map(([p, d]) => (
                          <div key={d} className={`dd-bar ${d === cell[1] ? "best" : ""}`}>
                            <span className="mono">{d}</span>
                            <span className="dd-track">
                              <span style={{ width: `${(p * 100).toFixed(1)}%` }} />
                            </span>
                            <span className="mono small dd-pct">{percent(p, 0)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Figure>
  );
}

// ---------------------------------------------------------------------------
// Draw a digit with the learner's own network
// ---------------------------------------------------------------------------

function Filters({ model, label }: { model: Model; label: string }) {
  const conv = model.layers.find((l) => l.type === "conv");
  if (!conv || conv.type !== "conv") return null;
  const [o, c, k] = conv.w.shape;
  return (
    <div className="learned-filters">
      <div className="small muted">{label}</div>
      <div className="lf-row">
        {Array.from({ length: o }, (_, f) => (
          <ArrayCanvas
            key={f}
            mode="diverging"
            size={44}
            data={{ h: k, w: k, values: conv.w.data.subarray(f * c * k * k, f * c * k * k + k * k) }}
            label={`Filter ${f + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function YourModelViz() {
  const { runs, error } = useFinishedRuns(true);
  const [runId, setRunId] = useState<number | null>(null);
  const [source, setSource] = useState<"yours" | "demo">("yours");
  const [yours, setYours] = useState<Model | null>(null);
  const [demo, setDemo] = useState<Model | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selected = runs?.find((r) => r.id === runId) ?? runs?.[0];

  useEffect(() => {
    getModel().then(setDemo, () => undefined);
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setYours(null);
    setLoadError(null);
    api
      .trainingModel(selected.id)
      .then(loadModel)
      .then(
        (m) => !cancelled && setYours(m),
        (e) => !cancelled && setLoadError(e instanceof ApiError ? e.message : String(e)),
      );
    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (runs === null)
    return (
      <div className="muted">
        <span className="spinner" /> Loading your runs…
      </div>
    );
  if (!selected) return <NoRunYet what="your own network (with the weights saved by save_tensor)" />;
  if (loadError) return <div className="alert alert-error">Couldn't load your model: {loadError}</div>;

  const showing = source === "yours" ? yours : demo;
  return (
    <>
      <DigitDemo
        model={showing}
        title={source === "yours" ? "Your network, reading your handwriting" : "The demo network, for comparison"}
        controls={
          <>
            <Segmented
              label="Model"
              value={source}
              onChange={setSource}
              options={[
                { value: "yours", label: `Your model (${percent(selected.accuracy ?? 0)})` },
                { value: "demo", label: `Demo model (${demo ? percent(demo.accuracy) : "…"})` },
              ]}
            />
            <RunPicker runs={runs} value={selected.id} onChange={setRunId} />
          </>
        }
        caption={
          source === "yours" ? (
            <>
              These are the weights your <code>train_cnn</code> saved, running in your browser with the same
              convolution, ReLU, max-pool and dense layer you wrote. Nothing here was trained by anyone but you.
            </>
          ) : (
            <>
              The demo network has two convolution layers (8 and 16 filters) and was trained for longer. Compare how
              sure each one is on the same drawing.
            </>
          )
        }
      />
      {yours && demo && (
        <Figure
          title="What the first layer learned"
          caption="Each square is one 3×3 filter (orange = positive weight, blue = negative). Nobody designed them: gradient descent found edge and stroke detectors on its own, much like the hand-made kernels in the convolution lesson. Your filters and the demo's won't match, since different random starting points lead to different, equally good solutions."
        >
          <div className="lf-compare">
            <Filters model={yours} label="Your filters" />
            <Filters model={demo} label="Demo model's first-layer filters" />
          </div>
        </Figure>
      )}
    </>
  );
}
