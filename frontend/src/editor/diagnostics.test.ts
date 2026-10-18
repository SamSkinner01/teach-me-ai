import { describe, expect, it } from "vitest";
import type { Report, TestOutcome } from "../api";
import { parseDiagnostics } from "./diagnostics";

function report(partial: Partial<Report>): Report {
  return {
    status: "failed",
    passed: 0,
    total: 0,
    tests: [],
    compile_output: "",
    stdout: "",
    stderr: "",
    message: "",
    time_ms: 0,
    used_reference: [],
    ...partial,
  };
}

function errorTest(detail: string, message = "boom"): TestOutcome {
  return { index: 0, description: "adds", hidden: false, status: "error", message, detail, args: null, expected: null, expect_error: false, actual: null };
}

describe("parseDiagnostics", () => {
  it("reads rustc errors in the solution file only", () => {
    const out = [
      "error[E0308]: mismatched types",
      " --> solution.rs:2:18",
      "  |",
      'warning: unused variable: `x`',
      " --> lib/la_dot.rs:1:5",
      "error: cannot find function `dott`",
      "  --> solution.rs:5:9",
    ].join("\n");
    const d = parseDiagnostics("rust", report({ status: "compile_error", compile_output: out }));
    expect(d).toEqual([
      { line: 2, column: 18, message: "mismatched types", severity: "error" },
      { line: 5, column: 9, message: "cannot find function `dott`", severity: "error" },
    ]);
  });

  it("reads g++ errors and ignores notes", () => {
    const out = [
      "solution.cpp: In function ‘double norm(const std::vector<double>&)’:",
      "solution.cpp:2:14: error: ‘const class std::vector<double>’ has no member named ‘lenght’",
      "solution.cpp:2:14: note: suggested alternative: ‘length’",
      "main.cpp:40:3: error: something in the harness",
    ].join("\n");
    const d = parseDiagnostics("cpp", report({ status: "compile_error", compile_output: out }));
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ line: 2, column: 14, severity: "error" });
  });

  it("reads Python syntax errors", () => {
    const out = 'File "solution.py", line 3\n    def norm(v)\n              ^\nSyntaxError: expected \':\'';
    const d = parseDiagnostics("python", report({ status: "load_error", compile_output: out }));
    expect(d).toEqual([{ line: 3, column: 1, message: "SyntaxError: expected ':'", severity: "error" }]);
  });

  it("points runtime errors at the deepest solution.py frame", () => {
    const tb = '  File "solution.py", line 7, in outer\n    inner()\n  File "solution.py", line 3, in inner\n    return v[10]\nIndexError: list index out of range';
    const d = parseDiagnostics("python", report({ tests: [errorTest(tb, "IndexError: list index out of range")] }));
    expect(d).toHaveLength(1);
    expect(d[0].line).toBe(3);
    expect(d[0].message).toContain("adds");
  });

  it("points Rust panics at their location", () => {
    const d = parseDiagnostics("rust", report({ tests: [errorTest("panicked at solution.rs:4:9", "Your code panicked: index out of bounds")] }));
    expect(d).toEqual([{ line: 4, column: 9, message: "Your code panicked: index out of bounds (in “adds”)", severity: "error" }]);
  });

  it("de-duplicates repeated errors on the same line", () => {
    const t = errorTest("panicked at solution.rs:4:9", "same");
    const d = parseDiagnostics("rust", report({ tests: [t, { ...t, index: 1 }] }));
    expect(d).toHaveLength(1);
  });
});
