import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  api,
  ApiError,
  LANGUAGE_NAMES,
  TERMINAL,
  type ExerciseData,
  type Language,
  type RunSummary,
  type TrainingConfig,
  type TrainingOverview,
  type TrainingParams,
  type TrainingRun,
} from "../api";
import { useSession } from "../state/session";
import { smooth, TrainingCurves } from "../viz/TrainingCurves";
import { ErrorBoundary } from "./ErrorBoundary";
import { EditorFallback, Modal, timeAgo } from "./Exercise";
import { Icon } from "./Icon";
import { RichText } from "./RichText";
import { signature } from "./signature";

const CodeEditor = lazy(() => import("../editor/CodeEditor"));

type SaveState = "saved" | "dirty" | "saving" | "error";

// Rough speed of the reference solution in the sandbox (1 CPU), for the time estimate.
const SPEED: Record<Language, { train: number; test: number; setup: number }> = {
  python: { train: 0.019, test: 0.006, setup: 2 },
  rust: { train: 0.00024, test: 0.0001, setup: 3 },
  cpp: { train: 0.00025, test: 0.0001, setup: 4 },
};

const TRAIN_SIZES = [500, 1000, 2000, 5000, 10000, 20000, 30000, 60000];
const LEARNING_RATES = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];
const BATCH_SIZES = [1, 5, 10, 16, 32, 64, 128];

function choices(list: number[], current: number, max = Infinity): number[] {
  return [...new Set([...list.filter((v) => v <= max), current])].sort((a, b) => a - b);
}

export function duration(seconds: number): string {
  if (seconds < 1) return "under a second";
  if (seconds < 90) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

function describeParams(p: TrainingParams): string {
  return [
    `${p.train_limit.toLocaleString()} images`,
    `${p.epochs} epoch${p.epochs === 1 ? "" : "s"}`,
    `η ${p.lr}`,
    `batch ${p.batch_size}`,
    ...(p.seed !== 42 ? [`seed ${p.seed}`] : []),
  ].join(" · ");
}

function mergeRun(prev: TrainingRun | null, next: TrainingRun): TrainingRun {
  if (!prev || prev.id !== next.id || next.points_from === 0) return next;
  if (next.points_from === prev.points.length)
    return { ...next, points_from: 0, points: prev.points.concat(next.points) };
  return { ...next, points_from: 0, points: prev.points };
}

function message(e: unknown): string {
  return e instanceof ApiError ? e.message : String(e);
}

// ---------------------------------------------------------------------------

function ParamControls({
  params,
  config,
  language,
  disabled,
  onChange,
}: {
  params: TrainingParams;
  config: TrainingConfig;
  language: Language;
  disabled: boolean;
  onChange: (p: TrainingParams) => void;
}) {
  const set = <K extends keyof TrainingParams>(key: K, value: TrainingParams[K]) =>
    onChange({ ...params, [key]: value });
  const speed = SPEED[language];
  const estimate = speed.setup + params.train_limit * params.epochs * speed.train + config.test_limit * speed.test;
  const isDefault =
    params.train_limit === config.train_limit &&
    params.epochs === config.epochs &&
    params.lr === config.lr &&
    params.batch_size === config.batch_size &&
    params.seed === 42;
  return (
    <div className="train-params">
      <label className="field">
        <span>Training images</span>
        <select
          className="input"
          value={params.train_limit}
          disabled={disabled}
          onChange={(e) => set("train_limit", Number(e.target.value))}
        >
          {choices(TRAIN_SIZES, params.train_limit, config.max_train_limit).map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Epochs</span>
        <select
          className="input"
          value={params.epochs}
          disabled={disabled}
          onChange={(e) => set("epochs", Number(e.target.value))}
        >
          {Array.from({ length: config.max_epochs }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Learning rate η</span>
        <select
          className="input"
          value={params.lr}
          disabled={disabled}
          onChange={(e) => set("lr", Number(e.target.value))}
        >
          {choices(LEARNING_RATES, params.lr).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Batch size</span>
        <select
          className="input"
          value={params.batch_size}
          disabled={disabled}
          onChange={(e) => set("batch_size", Number(e.target.value))}
        >
          {choices(BATCH_SIZES, params.batch_size).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Seed</span>
        <input
          className="input"
          type="number"
          min={0}
          max={2147483647}
          value={params.seed}
          disabled={disabled}
          onChange={(e) => set("seed", Math.max(0, Math.min(2147483647, Math.floor(Number(e.target.value) || 0))))}
        />
      </label>
      <div className="train-estimate small muted">
        <span>
          <Icon name="clock" size={13} /> About {duration(estimate)} with the reference code (yours may differ). Tested
          on {config.test_limit.toLocaleString()} images it has never seen.
        </span>
        {!isDefault && !disabled && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              onChange({
                train_limit: config.train_limit,
                epochs: config.epochs,
                lr: config.lr,
                batch_size: config.batch_size,
                seed: 42,
              })
            }
          >
            <Icon name="reset" size={13} /> Defaults
          </button>
        )}
      </div>
    </div>
  );
}

function RunStatusLine({ run, language, testLimit }: { run: TrainingRun; language: Language; testLimit: number }) {
  const last = run.points[run.points.length - 1];
  const epochs = run.params.epochs;
  if (run.status === "queued") {
    return (
      <div className="train-status">
        <span className="spinner" /> Waiting for a free trainer
        {run.queue_position ? ` (number ${run.queue_position} in the queue)` : ""}…
      </div>
    );
  }
  if (run.status !== "running") return null;
  if (!last) {
    return (
      <div className="train-status">
        <span className="spinner" /> {language === "python" ? "Starting" : "Compiling"} and loading{" "}
        {run.params.train_limit.toLocaleString()} images…
      </div>
    );
  }
  const fraction = Math.min(1, (last[0] + last[1] / last[2]) / epochs);
  const t = last[6];
  const left = fraction > 0.01 ? t / fraction - t : null;
  return (
    <div className="train-status">
      <span className="spinner" />
      {fraction >= 1 ? (
        <span>Training done. Testing on {testLimit.toLocaleString()} images…</span>
      ) : (
        <span>
          Epoch <strong>{last[0] + 1}</strong> of {epochs} · step {last[1].toLocaleString()} of{" "}
          {last[2].toLocaleString()} · {duration(run.elapsed ?? t)}
          {left !== null && ` · about ${duration(left)} left`}
        </span>
      )}
    </div>
  );
}

function RunResult({ run }: { run: TrainingRun }) {
  if (!TERMINAL.includes(run.status)) return null;
  const r = run.result;
  const last = run.points[run.points.length - 1];
  const smoothedLoss = smooth(run.points, 3).at(-1)?.[1];
  const ok = run.status === "succeeded";
  const headline =
    run.status === "cancelled"
      ? "Stopped"
      : !ok
        ? "Training failed"
        : run.passed
          ? `Test accuracy ${((run.accuracy ?? 0) * 100).toFixed(1)}%. Passed!`
          : `Test accuracy ${((run.accuracy ?? 0) * 100).toFixed(1)}%`;
  return (
    <div className="results">
      <div className={`results-banner ${run.passed ? "pass" : run.status === "cancelled" ? "" : "fail"}`}>
        <Icon name={run.passed ? "check" : run.status === "cancelled" ? "stop" : ok ? "chart" : "x"} />
        <div>
          <strong>{headline}</strong>
          {run.message && <div className="small">{run.message}</div>}
        </div>
      </div>
      {ok && last && (
        <div className="readout-strip train-stats">
          <div>
            <span className="muted small">test accuracy</span>
            <strong className="mono">{((run.accuracy ?? 0) * 100).toFixed(2)}%</strong>
          </div>
          <div>
            <span className="muted small">final training loss</span>
            <strong className="mono">{smoothedLoss === undefined ? "–" : smoothedLoss.toFixed(3)}</strong>
          </div>
          <div>
            <span className="muted small">training took</span>
            <strong className="mono">{duration(last[6])}</strong>
          </div>
          <div>
            <span className="muted small">images per second</span>
            <strong className="mono">
              {Math.round((run.params.train_limit * run.params.epochs) / Math.max(last[6], 0.01)).toLocaleString()}
            </strong>
          </div>
        </div>
      )}
      {r?.notes.map((n, i) => (
        <div key={i} className="alert alert-info small">
          {n}
        </div>
      ))}
      {r?.compile_output && <pre className="compile-output">{r.compile_output}</pre>}
      {r?.detail && <pre className="test-trace">{r.detail}</pre>}
      {r?.stdout && (
        <div className="program-output">
          <div className="program-output-label">
            <Icon name="terminal" size={14} /> Your program printed
          </div>
          <pre>{r.stdout}</pre>
        </div>
      )}
      {r?.stderr && r.outcome !== "compile_error" && (
        <div className="program-output stderr">
          <div className="program-output-label">
            <Icon name="terminal" size={14} /> stderr
          </div>
          <pre>{r.stderr}</pre>
        </div>
      )}
    </div>
  );
}

function RunHistory({
  runs,
  current,
  onView,
}: {
  runs: RunSummary[];
  current: number | undefined;
  onView: (id: number) => void;
}) {
  if (runs.length === 0) return null;
  return (
    <details className="train-history">
      <summary>
        <Icon name="history" size={14} /> Your runs ({runs.length})
      </summary>
      <ul className="history-list">
        {runs.map((r) => (
          <li key={r.id} className={r.id === current ? "current" : ""}>
            <span
              className={`badge ${r.passed ? "badge-success" : r.status === "succeeded" ? "" : r.status === "failed" ? "badge-danger" : "badge-accent"}`}
            >
              {r.status === "succeeded" && r.accuracy !== null ? `${(r.accuracy * 100).toFixed(1)}%` : r.status}
            </span>
            <span className="small">{describeParams(r.params)}</span>
            <span className="muted small">{timeAgo(r.created_at)}</span>
            <button className="btn btn-sm" disabled={r.id === current} onClick={() => onView(r.id)}>
              {r.id === current ? "Showing" : "View"}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

// ---------------------------------------------------------------------------

/** The capstone training exercise: write train_cnn, run it on MNIST, watch it learn. */
export function TrainingLab({ id, children }: { id: string; children?: ReactNode }) {
  const { language, refreshProgress } = useSession();
  const [data, setData] = useState<ExerciseData | null>(null);
  const [overview, setOverview] = useState<TrainingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [save, setSave] = useState<SaveState>("saved");
  const [params, setParams] = useState<TrainingParams | null>(null);
  const [run, setRun] = useState<TrainingRun | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);

  const codeRef = useRef(code);
  const runRef = useRef<TrainingRun | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setRun(null);
    setOverview(null);
    Promise.all([api.exercise(id), api.trainingOverview(id)])
      .then(async ([ex, ov]) => {
        if (cancelled) return;
        setData(ex);
        setCode(ex.code);
        codeRef.current = ex.code;
        setSave("saved");
        setOverview(ov);
        setParams({
          train_limit: ov.config.train_limit,
          epochs: ov.config.epochs,
          lr: ov.config.lr,
          batch_size: ov.config.batch_size,
          seed: 42,
        });
        const show = ov.active_run_id ?? ov.runs[0]?.id;
        if (show != null) {
          const r = await api.trainingRun(show);
          if (cancelled) return;
          setRun(r);
          setParams(r.params);
        }
      })
      .catch((e) => !cancelled && setError(message(e)));
    return () => {
      cancelled = true;
    };
  }, [id, language]);

  const flushSave = useCallback(() => {
    if (saveTimer.current === undefined) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    setSave("saving");
    api.saveDraft(id, codeRef.current).then(
      () => setSave((s) => (s === "saving" ? "saved" : s)),
      () => setSave("error"),
    );
  }, [id]);

  useEffect(() => () => flushSave(), [flushSave]);

  function onChange(value: string) {
    setCode(value);
    codeRef.current = value;
    setSave("dirty");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flushSave, 1200);
  }

  // Poll the run while it's queued or running.
  const runId = run?.id;
  const live = run !== null && !TERMINAL.includes(run.status);
  useEffect(() => {
    if (runId === undefined || !live) return;
    let stopped = false;
    let timer: number | undefined;
    const tick = async () => {
      const current = runRef.current;
      const since = current && current.id === runId ? current.points.length : 0;
      try {
        const next = await api.trainingRun(runId, since);
        if (stopped) return;
        setRun((prev) => mergeRun(prev, next));
        if (TERMINAL.includes(next.status)) {
          api.trainingOverview(id).then(setOverview, () => undefined);
          api.exercise(id).then(
            (ex) =>
              setData(
                (d) =>
                  d && { ...d, passed: ex.passed, attempts: ex.attempts, solution_available: ex.solution_available },
              ),
            () => undefined,
          );
          if (next.passed) refreshProgress().catch(() => undefined);
          return;
        }
      } catch {
        // a dropped poll; try again
      }
      if (!stopped) timer = window.setTimeout(tick, 1000);
    };
    timer = window.setTimeout(tick, 500);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [runId, live, id, refreshProgress]);

  async function start() {
    if (!params || starting || live) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    setStarting(true);
    setActionError(null);
    try {
      setRun(await api.startTraining(id, codeRef.current, params));
      setSave("saved");
      api.trainingOverview(id).then(setOverview, () => undefined);
    } catch (e) {
      setActionError(message(e));
    } finally {
      setStarting(false);
    }
  }

  async function stop() {
    if (!run) return;
    setActionError(null);
    try {
      await api.cancelTraining(run.id);
    } catch (e) {
      setActionError(message(e));
    }
  }

  async function view(runToShow: number) {
    setActionError(null);
    try {
      const r = await api.trainingRun(runToShow);
      setRun(r);
      setParams(r.params);
    } catch (e) {
      setActionError(message(e));
    }
  }

  async function openSolution() {
    setShowSolution(true);
    if (solution === null) {
      try {
        setSolution((await api.solution(id)).code);
      } catch (e) {
        setSolution(`// ${message(e)}`);
      }
    }
  }

  function replaceCode(next: string, confirmMessage: string) {
    if (codeRef.current !== next && !window.confirm(confirmMessage)) return false;
    onChange(next);
    return true;
  }

  if (error) {
    return (
      <section className="exercise card" id={`exercise-${id}`}>
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }
  if (!data || !overview || !params) {
    return (
      <section className="exercise card exercise-loading" id={`exercise-${id}`}>
        <span className="spinner" /> Loading the training lab…
      </section>
    );
  }

  const lang = data.language;
  const config = overview.config;

  return (
    <section className={`exercise card training-lab ${data.passed ? "is-passed" : ""}`} id={`exercise-${id}`}>
      <header className="exercise-head">
        <div className="exercise-title">
          <span className="exercise-kicker">
            <Icon name="chart" size={14} /> Training run · {LANGUAGE_NAMES[lang]}
          </span>
          <h3>{data.title}</h3>
        </div>
        {data.passed ? (
          <span className="badge badge-success">
            <Icon name="check" size={12} /> Passed
          </span>
        ) : (
          <span className="badge badge-accent">Needs {(config.threshold * 100).toFixed(0)}% test accuracy</span>
        )}
      </header>

      {children && <div className="exercise-prompt">{children}</div>}

      <div className="exercise-signature">
        <span className="muted small">Signature (keep it exactly like this)</span>
        <code>{signature(lang, data.function, data.params, data.returns)}</code>
      </div>

      {data.library.length > 0 && (
        <details className="exercise-library">
          <summary>
            <Icon name="book" size={14} /> {data.library.length} functions from your library are available, plus{" "}
            <code>report_progress</code>, <code>report_predictions</code> and <code>save_tensor</code>
          </summary>
          <div className="library-chips">
            {data.library.map((f) => (
              <code key={f}>{f}</code>
            ))}
          </div>
        </details>
      )}

      <div className="exercise-editor">
        <div className="editor-toolbar">
          <span className="editor-file mono">train.{lang === "python" ? "py" : lang === "rust" ? "rs" : "cpp"}</span>
          <span className={`save-state ${save}`}>
            {save === "saved" ? "Saved" : save === "saving" ? "Saving…" : save === "dirty" ? "Edited" : "Couldn't save"}
          </span>
          <div className="editor-tools">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => replaceCode(data.starter, "Replace your code with the starter code?")}
              title="Start over from the starter code"
            >
              <Icon name="reset" size={14} /> Reset
            </button>
          </div>
        </div>
        <ErrorBoundary what="the code editor">
          <Suspense fallback={<EditorFallback height={480} />}>
            <CodeEditor
              value={code}
              language={lang}
              onChange={onChange}
              onRun={start}
              onSubmit={start}
              library={data.library_functions}
              height={480}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="train-launch">
        <ParamControls
          params={params}
          config={config}
          language={lang}
          disabled={live || starting}
          onChange={setParams}
        />
        <div className="editor-actions">
          {live ? (
            <button className="btn btn-danger" onClick={stop}>
              <Icon name="stop" size={14} /> Stop
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={start}
              disabled={starting || !overview.available}
              title="Ctrl/⌘ + Enter"
            >
              {starting ? <span className="spinner" /> : <Icon name="play" size={14} />} Start training
            </button>
          )}
          <span className="kbd-hint small muted">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> start
          </span>
        </div>
      </div>

      {!overview.available && (
        <div className="alert alert-error">
          The MNIST files aren't installed on this server, so training can't run. (The administrator needs to run
          scripts/fetch_mnist.py.)
        </div>
      )}
      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="train-dashboard" aria-live="polite">
        {run ? (
          <>
            <RunStatusLine run={run} language={lang} testLimit={config.test_limit} />
            {run.status === "running" && run.points.length > 0 && (
              <div className="train-progress" role="progressbar" aria-label="Training progress">
                <span
                  style={{
                    width: `${(() => {
                      const p = run.points[run.points.length - 1];
                      return Math.min(100, ((p[0] + p[1] / p[2]) / run.params.epochs) * 100);
                    })()}%`,
                  }}
                />
              </div>
            )}
            {(run.points.length > 0 || run.status === "running") && (
              <TrainingCurves
                points={run.points}
                epochs={run.params.epochs}
                threshold={config.threshold}
                testAccuracy={run.status === "succeeded" ? run.accuracy : null}
              />
            )}
            <RunResult run={run} />
          </>
        ) : (
          <div className="results-busy train-empty">
            <Icon name="chart" /> Finish the TODOs, then start a run. Its loss and accuracy curves will appear here as
            it trains.
          </div>
        )}
      </div>

      <RunHistory runs={overview.runs} current={run?.id} onView={view} />

      <footer className="exercise-foot">
        <div className="hints">
          {data.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="hint">
              <span className="hint-label">Hint {i + 1}</span>
              <RichText text={h} />
            </div>
          ))}
        </div>
        <div className="exercise-foot-actions">
          {hintsShown < data.hints.length && (
            <button className="btn btn-sm" onClick={() => setHintsShown(hintsShown + 1)}>
              <Icon name="bulb" size={14} /> {hintsShown === 0 ? "Show a hint" : "Another hint"} ({hintsShown + 1}/
              {data.hints.length})
            </button>
          )}
          {data.solution_available ? (
            <button className="btn btn-sm btn-ghost" onClick={openSolution}>
              <Icon name="eye" size={14} /> Reference solution
            </button>
          ) : (
            <span className="small muted">The reference solution unlocks after 3 finished runs.</span>
          )}
        </div>
      </footer>

      {showSolution && (
        <Modal title={`Reference solution · ${LANGUAGE_NAMES[lang]}`} onClose={() => setShowSolution(false)}>
          {solution === null ? (
            <EditorFallback height={200} />
          ) : (
            <Suspense fallback={<EditorFallback height={200} />}>
              <CodeEditor value={solution} language={lang} readOnly label="Reference solution" />
            </Suspense>
          )}
          <div className="modal-actions">
            <button
              className="btn"
              disabled={solution === null}
              onClick={() =>
                solution !== null &&
                replaceCode(solution, "Replace your code with the reference solution?") &&
                setShowSolution(false)
              }
            >
              <Icon name="copy" size={14} /> Use in editor
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
