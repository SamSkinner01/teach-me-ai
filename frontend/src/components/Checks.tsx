// Interactive concept checks: multiple choice, a numeric answer, a matrix answer.
// Answers live in the lesson source; that's fine, these are for practice.

import { useState } from "react";
import { useSession } from "../state/session";
import { Icon } from "./Icon";
import { RichText } from "./RichText";

function useCheck(id: string) {
  const { progress, markCheck } = useSession();
  const doneBefore = progress?.checks.includes(id) ?? false;
  return { doneBefore, markDone: () => markCheck(id) };
}

export function Quiz({
  id,
  question,
  options,
  answer,
  explain,
}: {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explain?: string;
}) {
  const { doneBefore, markDone } = useCheck(id);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const solved = picked === answer;

  function choose(i: number) {
    if (solved) return;
    setPicked(i);
    if (i === answer) markDone();
    else setWrong((w) => new Set(w).add(i));
  }

  return (
    <div className="check card">
      <div className="check-head">
        <span className="check-kind">Check your understanding</span>
        {(doneBefore || solved) && (
          <span className="badge badge-success">
            <Icon name="check" size={12} /> {solved ? "Correct" : "Answered"}
          </span>
        )}
      </div>
      <div className="check-question">
        <RichText text={question} />
      </div>
      <div className="quiz-options" role="group" aria-label="Answers">
        {options.map((opt, i) => {
          const state = solved && i === answer ? "right" : wrong.has(i) ? "wrong" : "";
          return (
            <button key={i} className={`quiz-option ${state}`} onClick={() => choose(i)} disabled={solved && i !== answer}>
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span>
                <RichText text={opt} />
              </span>
            </button>
          );
        })}
      </div>
      {picked !== null && !solved && <p className="check-feedback wrong">Not quite. Try another answer.</p>}
      {solved && explain && (
        <p className="check-feedback right">
          <RichText text={explain} />
        </p>
      )}
    </div>
  );
}

function parseNumber(s: string): number | null {
  const t = s.trim().replace(/−/g, "-");
  if (t === "") return null;
  if (/^-?\d+\s*\/\s*\d+$/.test(t)) {
    const [a, b] = t.split("/").map(Number);
    return b === 0 ? null : a / b;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function close(a: number, b: number, tol: number) {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

export function NumericCheck({
  id,
  question,
  answer,
  tolerance = 1e-3,
  explain,
  unit,
}: {
  id: string;
  question: string;
  answer: number;
  tolerance?: number;
  explain?: string;
  unit?: string;
}) {
  const { doneBefore, markDone } = useCheck(id);
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");

  function check() {
    const n = parseNumber(value);
    if (n === null) return setState("wrong");
    if (close(n, answer, tolerance)) {
      setState("right");
      markDone();
    } else setState("wrong");
  }

  return (
    <div className="check card">
      <div className="check-head">
        <span className="check-kind">Work it out</span>
        {(doneBefore || state === "right") && (
          <span className="badge badge-success">
            <Icon name="check" size={12} /> {state === "right" ? "Correct" : "Answered"}
          </span>
        )}
      </div>
      <div className="check-question">
        <RichText text={question} />
      </div>
      <form
        className="numeric-row"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input
          className={`input numeric-input ${state}`}
          value={value}
          inputMode="decimal"
          aria-label="Your answer"
          placeholder="Your answer"
          onChange={(e) => {
            setValue(e.target.value);
            setState("idle");
          }}
        />
        {unit && <span className="muted">{unit}</span>}
        <button className="btn" type="submit">
          Check
        </button>
      </form>
      {state === "wrong" && <p className="check-feedback wrong">Not quite. Check your arithmetic and try again.</p>}
      {state === "right" && (
        <p className="check-feedback right">
          <RichText text={explain ?? "Correct!"} />
        </p>
      )}
    </div>
  );
}

export function MatrixCheck({
  id,
  question,
  answer,
  explain,
}: {
  id: string;
  question: string;
  answer: number[][];
  explain?: string;
}) {
  const { doneBefore, markDone } = useCheck(id);
  const rows = answer.length;
  const cols = answer[0]?.length ?? 0;
  const [cells, setCells] = useState<string[][]>(() => answer.map((r) => r.map(() => "")));
  const [checked, setChecked] = useState(false);

  const status = cells.map((r, i) =>
    r.map((c, j) => {
      const n = parseNumber(c);
      return n !== null && close(n, answer[i][j], 1e-6);
    }),
  );
  const allRight = status.every((r) => r.every(Boolean));

  function check() {
    setChecked(true);
    if (allRight) markDone();
  }

  return (
    <div className="check card">
      <div className="check-head">
        <span className="check-kind">By hand</span>
        {(doneBefore || (checked && allRight)) && (
          <span className="badge badge-success">
            <Icon name="check" size={12} /> {checked && allRight ? "Correct" : "Answered"}
          </span>
        )}
      </div>
      <div className="check-question">
        <RichText text={question} />
      </div>
      <form
        className="matrix-check"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <div className="matrix-inputs" style={{ gridTemplateColumns: `repeat(${cols}, 64px)` }}>
          {cells.map((r, i) =>
            r.map((c, j) => (
              <input
                key={`${i}-${j}`}
                className={`input matrix-cell ${checked ? (status[i][j] ? "right" : "wrong") : ""}`}
                value={c}
                inputMode="decimal"
                aria-label={`Row ${i + 1}, column ${j + 1}`}
                onChange={(e) => {
                  const next = cells.map((row) => [...row]);
                  next[i][j] = e.target.value;
                  setCells(next);
                  setChecked(false);
                }}
              />
            )),
          )}
        </div>
        <button className="btn" type="submit" disabled={rows === 0}>
          Check
        </button>
      </form>
      {checked && !allRight && <p className="check-feedback wrong">The red cells are wrong. Keep going!</p>}
      {checked && allRight && (
        <p className="check-feedback right">
          <RichText text={explain ?? "All correct!"} />
        </p>
      )}
    </div>
  );
}
