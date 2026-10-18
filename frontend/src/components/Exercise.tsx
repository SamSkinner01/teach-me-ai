import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError, LANGUAGE_NAMES, type ExerciseData, type Report, type Submission } from "../api";
import { useSession } from "../state/session";
import { Icon } from "./Icon";
import { RichText } from "./RichText";
import { signature } from "./signature";
import { ReportView, TestList } from "./TestResults";

const CodeEditor = lazy(() => import("../editor/CodeEditor"));

type SaveState = "saved" | "dirty" | "saving" | "error";

function EditorFallback({ height = 300 }: { height?: number }) {
  return (
    <div className="code-editor editor-loading" style={{ height }}>
      <span className="spinner" />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString();
}

export function Exercise({ id, children }: { id: string; children?: ReactNode }) {
  const { language, refreshProgress } = useSession();
  const [data, setData] = useState<ExerciseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [save, setSave] = useState<SaveState>("saved");
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [report, setReport] = useState<{ report: Report; submitted: boolean } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [modal, setModal] = useState<null | "solution" | "history">(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [history, setHistory] = useState<Submission[] | null>(null);

  const codeRef = useRef(code);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setReport(null);
    api.exercise(id).then(
      (ex) => {
        if (cancelled) return;
        setData(ex);
        setCode(ex.code);
        codeRef.current = ex.code;
        setSave("saved");
      },
      (e: ApiError) => !cancelled && setError(e.message),
    );
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

  // Save any pending edit when leaving the page.
  useEffect(() => () => flushSave(), [flushSave]);

  function onChange(value: string) {
    setCode(value);
    codeRef.current = value;
    setSave("dirty");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flushSave, 1200);
  }

  async function execute(kind: "run" | "submit") {
    if (!data || busy) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    setBusy(kind);
    setRunError(null);
    try {
      const res = kind === "run" ? await api.run(id, codeRef.current) : await api.submit(id, codeRef.current);
      setReport({ report: res.report, submitted: res.submitted });
      setSave("saved");
      setData((d) => d && { ...d, passed: res.passed, attempts: res.attempts, solution_available: res.solution_available });
      if (kind === "submit") {
        setHistory(null);
        if (res.passed) refreshProgress().catch(() => undefined);
      }
    } catch (e) {
      setRunError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function openSolution() {
    setModal("solution");
    if (solution === null) {
      try {
        setSolution((await api.solution(id)).code);
      } catch (e) {
        setSolution(`// ${e instanceof ApiError ? e.message : String(e)}`);
      }
    }
  }

  async function openHistory() {
    setModal("history");
    try {
      setHistory(await api.submissions(id));
    } catch {
      setHistory([]);
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
        <div className="exercise-head">
          <div>
            <span className="exercise-kicker">Exercise</span>
          </div>
        </div>
        <div className="alert alert-error">{error}</div>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="exercise card exercise-loading" id={`exercise-${id}`}>
        <span className="spinner" /> Loading exercise…
      </section>
    );
  }

  const lang = data.language;
  const compiled = lang !== "python";

  return (
    <section className={`exercise card ${data.passed ? "is-passed" : ""}`} id={`exercise-${id}`}>
      <header className="exercise-head">
        <div className="exercise-title">
          <span className="exercise-kicker">
            <Icon name="code" size={14} /> Exercise · {LANGUAGE_NAMES[lang]}
          </span>
          <h3>{data.title}</h3>
        </div>
        {data.passed ? (
          <span className="badge badge-success">
            <Icon name="check" size={12} /> Passed
          </span>
        ) : data.attempts > 0 ? (
          <span className="badge">
            {data.attempts} submission{data.attempts === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="badge badge-accent">To do</span>
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
            <Icon name="book" size={14} /> {data.library.length} function{data.library.length === 1 ? "" : "s"} from your
            library {data.library.length === 1 ? "is" : "are"} available
          </summary>
          <div className="library-chips">
            {data.library.map((f) => (
              <code key={f}>{f}</code>
            ))}
          </div>
        </details>
      )}

      <div className="exercise-body">
        <div className="exercise-editor">
          <div className="editor-toolbar">
            <span className="editor-file mono">solution.{lang === "python" ? "py" : lang === "rust" ? "rs" : "cpp"}</span>
            <span className={`save-state ${save}`}>
              {save === "saved" ? "Saved" : save === "saving" ? "Saving…" : save === "dirty" ? "Edited" : "Couldn't save"}
            </span>
            <div className="editor-tools">
              <button className="btn btn-ghost btn-sm" onClick={openHistory} title="Your past submissions">
                <Icon name="history" size={14} /> History
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => replaceCode(data.starter, "Replace your code with the starter code?")}
                title="Start over from the starter code"
              >
                <Icon name="reset" size={14} /> Reset
              </button>
            </div>
          </div>
          <Suspense fallback={<EditorFallback />}>
            <CodeEditor
              value={code}
              language={lang}
              onChange={onChange}
              onRun={() => execute("run")}
              onSubmit={() => execute("submit")}
            />
          </Suspense>
          <div className="editor-actions">
            <button className="btn" onClick={() => execute("run")} disabled={busy !== null} title="Ctrl/⌘ + Enter">
              {busy === "run" ? <span className="spinner" /> : <Icon name="play" size={14} />} Run examples
            </button>
            <button
              className="btn btn-primary"
              onClick={() => execute("submit")}
              disabled={busy !== null}
              title="Ctrl/⌘ + Shift + Enter"
            >
              {busy === "submit" ? <span className="spinner" /> : <Icon name="send" size={14} />} Submit
            </button>
            <span className="kbd-hint small muted">
              <kbd>Ctrl</kbd>+<kbd>Enter</kbd> run · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> submit
            </span>
          </div>
        </div>

        <div className="exercise-results" aria-live="polite">
          {runError && <div className="alert alert-error">{runError}</div>}
          {busy ? (
            <div className="results results-busy">
              <span className="spinner" /> {compiled ? "Compiling and running" : "Running"} your code
              {busy === "submit" ? " against every test" : ""}…
            </div>
          ) : report ? (
            <ReportView report={report.report} submitted={report.submitted} exercise={data} />
          ) : (
            <TestList exercise={data} />
          )}
        </div>
      </div>

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
            <span className="small muted">The reference solution unlocks after 3 submissions.</span>
          )}
        </div>
      </footer>

      {modal === "solution" && (
        <Modal title={`Reference solution · ${LANGUAGE_NAMES[lang]}`} onClose={() => setModal(null)}>
          {!data.passed && (
            <p className="small muted">
              Reading a solution is a fine way to learn. Try typing it out yourself rather than pasting it, and make sure
              you understand every line.
            </p>
          )}
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
                setModal(null)
              }
            >
              <Icon name="copy" size={14} /> Use in editor
            </button>
          </div>
        </Modal>
      )}

      {modal === "history" && (
        <Modal title="Your submissions" onClose={() => setModal(null)}>
          {history === null ? (
            <span className="spinner" />
          ) : history.length === 0 ? (
            <p className="muted">No submissions yet. Press Submit to run every test.</p>
          ) : (
            <ul className="history-list">
              {history.map((s) => (
                <li key={s.id}>
                  <span className={`badge ${s.status === "passed" ? "badge-success" : "badge-danger"}`}>
                    {s.status === "passed" ? "passed" : s.status.replace("_", " ")}
                  </span>
                  <span>
                    {s.passed}/{s.total} tests
                  </span>
                  <span className="muted small">{timeAgo(s.created_at)}</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => replaceCode(s.code, "Replace your code with this submission?") && setModal(null)}
                  >
                    Load
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </section>
  );
}
