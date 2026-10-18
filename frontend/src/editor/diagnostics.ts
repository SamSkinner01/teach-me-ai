// Turn compiler output, tracebacks and panic locations from a test report into
// line-level diagnostics for the learner's own file (shown as squiggles).

import type { Language, Report } from "../api";

export interface Diagnostic {
  line: number; // 1-based
  column: number; // 1-based
  message: string;
  severity: "error" | "warning";
}

function rustCompile(out: string): Diagnostic[] {
  const lines = out.split("\n");
  const found: Diagnostic[] = [];
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(/^(error|warning)(?:\[E\d+\])?: (.+)$/);
    if (!head) continue;
    // The location line follows within a few lines: " --> solution.rs:3:5"
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      const loc = lines[j].match(/-->\s+(\S+):(\d+):(\d+)/);
      if (!loc) continue;
      if (loc[1] === "solution.rs") {
        found.push({ line: Number(loc[2]), column: Number(loc[3]), message: head[2], severity: head[1] === "error" ? "error" : "warning" });
      }
      break;
    }
  }
  return found;
}

function cppCompile(out: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  for (const line of out.split("\n")) {
    const m = line.match(/^solution\.cpp:(\d+):(\d+): (error|warning): (.+)$/);
    if (m) found.push({ line: Number(m[1]), column: Number(m[2]), message: m[4], severity: m[3] === "error" ? "error" : "warning" });
  }
  return found;
}

/** Python tracebacks and syntax errors: the last frame in solution.py, plus the final message line. */
function pythonTrace(text: string, fallbackMessage?: string): Diagnostic[] {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  let line = 0;
  for (const l of lines) {
    const m = l.match(/File "solution\.py", line (\d+)/);
    if (m) line = Number(m[1]);
  }
  if (!line) return [];
  const last = lines[lines.length - 1]?.trim() ?? "";
  return [{ line, column: 1, message: fallbackMessage ?? last, severity: "error" }];
}

function rustPanic(detail: string, message: string): Diagnostic[] {
  const m = detail.match(/panicked at solution\.rs:(\d+):(\d+)/);
  return m ? [{ line: Number(m[1]), column: Number(m[2]), message, severity: "error" }] : [];
}

export function parseDiagnostics(language: Language, report: Report): Diagnostic[] {
  const found: Diagnostic[] = [];
  if (report.status === "compile_error") {
    found.push(...(language === "rust" ? rustCompile(report.compile_output) : cppCompile(report.compile_output)));
  } else if (report.status === "load_error" && language === "python") {
    found.push(...pythonTrace(report.compile_output));
  }
  for (const t of report.tests) {
    if (t.status !== "error" || !t.detail) continue;
    const label = t.description || `test ${t.index + 1}`;
    const message = `${t.message} (in “${label}”)`;
    if (language === "python") found.push(...pythonTrace(t.detail, message));
    else if (language === "rust") found.push(...rustPanic(t.detail, message));
  }
  // One marker per line and message.
  const seen = new Set<string>();
  return found.filter((d) => {
    const key = `${d.line}:${d.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
