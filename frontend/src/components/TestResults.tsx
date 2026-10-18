import { useState } from "react";
import type { ExerciseData, Report, TestOutcome } from "../api";
import { Icon } from "./Icon";
import { RichText } from "./RichText";
import { Value } from "./Value";

function Args({ params, args }: { params: ExerciseData["params"]; args: unknown[] }) {
  return (
    <span className="test-args">
      {params.map((p, i) => (
        <span key={p.name} className="test-arg">
          <span className="test-arg-name">{p.name} =</span> <Value v={args[i]} />
        </span>
      ))}
    </span>
  );
}

export function TestList({ exercise }: { exercise: ExerciseData }) {
  return (
    <div className="results">
      <div className="results-banner neutral">
        <Icon name="eye" />
        <div>
          <strong>
            {exercise.tests.length} example test{exercise.tests.length === 1 ? "" : "s"}
          </strong>
          <div className="small muted">
            Run checks these. Submit also runs {exercise.hidden_count} hidden test{exercise.hidden_count === 1 ? "" : "s"}.
          </div>
        </div>
      </div>
      <ol className="test-list">
        {exercise.tests.map((t) => (
          <li key={t.index} className="test idle">
            <div className="test-line">
              <Icon name="circle" size={14} className="test-icon" />
              <span className="test-desc">{t.description || `Test ${t.index + 1}`}</span>
            </div>
            <div className="test-detail">
              <Args params={exercise.params} args={t.args} />
              <div className="test-expect">
                <span className="muted">expected</span>{" "}
                {t.expect_error ? <span className="badge badge-warning">an error</span> : <Value v={t.expected} />}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const STATUS_ICON: Record<TestOutcome["status"], string> = { pass: "check", fail: "x", error: "x", not_run: "circle" };

function Outcome({ t, exercise }: { t: TestOutcome; exercise: ExerciseData }) {
  const [open, setOpen] = useState(t.status !== "pass");
  const label = t.description || (t.hidden ? `Hidden test ${t.index + 1}` : `Test ${t.index + 1}`);
  return (
    <li className={`test ${t.status}`}>
      <button className="test-line" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name={STATUS_ICON[t.status]} size={14} className="test-icon" />
        <span className="test-desc">
          {label}
          {t.hidden && <span className="badge">hidden</span>}
        </span>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={14} className="test-chevron" />
      </button>
      {open && (
        <div className="test-detail">
          {t.args && <Args params={exercise.params} args={t.args} />}
          {t.message && <div className={`test-message ${t.status}`}>{t.message}</div>}
          {t.status !== "not_run" && (
            <div className="test-compare">
              <div>
                <span className="muted">expected</span>{" "}
                {t.expect_error ? <span className="badge badge-warning">an error</span> : <Value v={t.expected} />}
              </div>
              {t.status !== "error" && t.actual !== null && t.actual !== undefined && (
                <div>
                  <span className="muted">got</span> <Value v={t.actual} />
                </div>
              )}
            </div>
          )}
          {t.detail && <pre className="test-trace">{t.detail}</pre>}
        </div>
      )}
    </li>
  );
}

function listFunctions(names: string[]): string {
  const shown = names.slice(0, 4).map((f) => `\`${f}\``);
  const rest = names.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} and ${rest} other library function${rest === 1 ? "" : "s"}` : shown.join(", ");
}

const BANNER: Record<Report["status"], { cls: string; icon: string }> = {
  passed: { cls: "pass", icon: "check" },
  failed: { cls: "fail", icon: "x" },
  compile_error: { cls: "fail", icon: "code" },
  load_error: { cls: "fail", icon: "code" },
  crashed: { cls: "fail", icon: "x" },
  timeout: { cls: "fail", icon: "clock" },
};

function headline(report: Report, submitted: boolean): string {
  switch (report.status) {
    case "passed":
      return submitted ? `All ${report.total} tests passed. Exercise complete!` : `All ${report.total} example tests pass. Now Submit.`;
    case "failed":
      return `${report.passed} of ${report.total} tests passed`;
    case "compile_error":
      return "Compilation failed";
    case "load_error":
      return "Your code has an error";
    case "crashed":
      return "Your program crashed";
    case "timeout":
      return "Time limit exceeded";
  }
}

export function ReportView({ report, submitted, exercise }: { report: Report; submitted: boolean; exercise: ExerciseData }) {
  const b = BANNER[report.status];
  const showTests = report.status !== "compile_error" && report.status !== "load_error";
  return (
    <div className="results">
      <div className={`results-banner ${b.cls}`}>
        <Icon name={b.icon} />
        <div>
          <strong>{headline(report, submitted)}</strong>
          {report.message && <div className="small">{report.message}</div>}
          {report.time_ms > 0 && showTests && <div className="small muted">ran in {report.time_ms} ms</div>}
        </div>
      </div>

      {report.compile_output && <pre className="compile-output">{report.compile_output}</pre>}

      {showTests && (
        <ol className="test-list">
          {report.tests.map((t) => (
            <Outcome key={t.index} t={t} exercise={exercise} />
          ))}
        </ol>
      )}

      {report.stdout && (
        <div className="program-output">
          <div className="program-output-label">
            <Icon name="terminal" size={14} /> Your program printed
          </div>
          <pre>{report.stdout}</pre>
        </div>
      )}
      {report.stderr && report.status !== "compile_error" && (
        <div className="program-output stderr">
          <div className="program-output-label">
            <Icon name="terminal" size={14} /> stderr
          </div>
          <pre>{report.stderr}</pre>
        </div>
      )}

      {report.used_reference.length > 0 && (
        <p className="small muted reference-note">
          <RichText
            text={`You haven't passed ${listFunctions(report.used_reference)} yet, so a reference version was used for ${report.used_reference.length === 1 ? "it" : "them"}.`}
          />
        </p>
      )}
    </div>
  );
}
