"""Turns raw sandbox output into a test report the learner can read."""

from __future__ import annotations

import json
import math
import re
from dataclasses import asdict, dataclass, field
from typing import Any

from .codegen import describe_arg
from .sandbox import JobResult

DEFAULT_TOLERANCE = {"rel": 1e-6, "abs": 1e-9}

# Messages that mean "the learner hasn't written this yet".
_NOT_IMPLEMENTED = re.compile(r"not (yet )?implemented|NotImplementedError", re.IGNORECASE)


@dataclass
class TestOutcome:
    index: int
    description: str
    hidden: bool
    status: str  # "pass" | "fail" | "error" | "not_run"
    message: str = ""
    detail: str = ""
    args: list[Any] | None = None  # only for visible tests
    expected: Any = None
    expect_error: bool = False
    actual: Any = None


@dataclass
class Report:
    # "passed" | "failed" | "compile_error" | "load_error" | "crashed" | "timeout"
    status: str
    passed: int
    total: int
    tests: list[TestOutcome]
    compile_output: str = ""
    stdout: str = ""
    stderr: str = ""
    message: str = ""
    time_ms: int = 0
    used_reference: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# --------------------------------------------------------------------------
# Value comparison
# --------------------------------------------------------------------------


def _fmt(x: Any) -> str:
    if isinstance(x, float):
        if math.isnan(x):
            return "NaN"
        return f"{x:.10g}"
    return json.dumps(x) if not isinstance(x, str) else x


def _is_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _type_name(x: Any) -> str:
    if isinstance(x, dict) and "__type__" in x:
        return f"a {x['__type__']} ({x.get('__repr__', '')})"
    if x is None:
        return "nothing (None)"
    if isinstance(x, bool):
        return "a boolean"
    if _is_number(x):
        return "a number"
    if isinstance(x, list):
        return "a list"
    if isinstance(x, str):
        return "a string"
    return type(x).__name__


def _close(expected: float, actual: float, tol: dict[str, float]) -> bool:
    if math.isnan(expected):
        return math.isnan(actual)
    if math.isinf(expected) or math.isinf(actual):
        return expected == actual
    return abs(actual - expected) <= tol["abs"] + tol["rel"] * abs(expected)


def _shape(m: list[list[Any]]) -> str:
    cols = len(m[0]) if m else 0
    return f"{len(m)}×{cols}"


def compare(type_: str, expected: Any, actual: Any, tol: dict[str, float]) -> tuple[bool, str]:
    """Return (ok, explanation-if-not-ok)."""
    if type_ == "float":
        if not _is_number(actual):
            return False, f"Expected a number, but got {_type_name(actual)}."
        if _close(float(expected), float(actual), tol):
            return True, ""
        return False, f"Expected {_fmt(float(expected))}, got {_fmt(float(actual))}."

    if type_ == "int":
        if not _is_number(actual) or (isinstance(actual, float) and not actual.is_integer()):
            return False, f"Expected a whole number, but got {_type_name(actual)} ({_fmt(actual)})."
        if int(actual) == int(expected):
            return True, ""
        return False, f"Expected {int(expected)}, got {int(actual)}."

    if type_ == "bool":
        if not isinstance(actual, bool):
            return False, f"Expected true or false, but got {_type_name(actual)}."
        return (actual == expected), ("" if actual == expected else f"Expected {expected}, got {actual}.")

    if type_ in ("vec", "ivec"):
        if not isinstance(actual, list):
            return False, f"Expected a list, but got {_type_name(actual)}."
        if len(actual) != len(expected):
            return False, f"Expected a vector of length {len(expected)}, but got length {len(actual)}."
        elem = "float" if type_ == "vec" else "int"
        for i, (e, a) in enumerate(zip(expected, actual)):
            ok, why = compare(elem, e, a, tol)
            if not ok:
                return False, f"Element [{i}] is wrong. {why}"
        return True, ""

    if type_ == "mat":
        if not isinstance(actual, list) or any(not isinstance(r, list) for r in actual):
            return False, f"Expected a matrix (a list of rows), but got {_type_name(actual)}."
        for r, row in enumerate(actual):
            if actual and len(row) != len(actual[0]):
                return False, (
                    f"Your matrix is ragged: row {r} has {len(row)} columns, "
                    f"but row 0 has {len(actual[0])}."
                )
        if len(actual) != len(expected) or (expected and len(actual[0]) != len(expected[0])):
            return False, f"Expected a {_shape(expected)} matrix, but got a {_shape(actual)} matrix."
        for r, (erow, arow) in enumerate(zip(expected, actual)):
            for c, (e, a) in enumerate(zip(erow, arow)):
                ok, why = compare("float", e, a, tol)
                if not ok:
                    return False, f"Element [{r}][{c}] is wrong. {why}"
        return True, ""

    raise ValueError(f"cannot compare type {type_!r}")


# --------------------------------------------------------------------------
# Report building
# --------------------------------------------------------------------------


def _error_message(result: dict[str, Any]) -> str:
    msg = result.get("message") or ""
    kind = result.get("error_type") or "error"
    if _NOT_IMPLEMENTED.search(msg) or _NOT_IMPLEMENTED.search(kind):
        return "Not implemented yet: replace the TODO with your code."
    if kind == "panic":
        return f"Your code panicked: {msg}"
    return f"{kind}: {msg}" if msg else kind


def _parse_lines(text: str) -> list[dict[str, Any]]:
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def _clip(text: str, limit: int = 20000) -> str:
    return text if len(text) <= limit else text[:limit] + "\n… (output truncated)"


_INCLUDED_FROM = re.compile(r"^In file included from main\.cpp:\d+[:,]\s*$\n?", re.MULTILINE)
_HARNESS_FILES = re.compile(r"\bmain\.(rs|cpp):\d+")

SIGNATURE_HINT = (
    "Some errors point at main.rs / main.cpp, the generated test program that calls your function. "
    "That usually means the function's name, parameter types or return type no longer match the "
    "starter code. Keep the signature exactly as given."
)


def _compiler_output(text: str) -> tuple[str, bool]:
    """Tidy compiler output; also report whether it blames the generated harness."""
    text = _INCLUDED_FROM.sub("", text)
    return _clip(text), bool(_HARNESS_FILES.search(text))


def _signal_message(sig: str | None, exit_code: int | None) -> str:
    if sig == "SIGSEGV":
        return "Your program crashed with a segmentation fault (it read or wrote memory it doesn't own, such as an out-of-bounds index)."
    if sig == "SIGABRT":
        return "Your program aborted (for example a failed assertion or a stack overflow from infinite recursion)."
    if sig == "SIGKILL":
        return "Your program was killed. It probably used too much memory or CPU time."
    if sig == "SIGFPE":
        return "Your program crashed with an arithmetic error (such as an integer division by zero)."
    if sig:
        return f"Your program was stopped by signal {sig}."
    return f"Your program exited with code {exit_code}."


def build_report(
    spec: dict[str, Any],
    tests: list[tuple[int, dict[str, Any]]],
    job_result: JobResult,
    used_reference: list[str] | None = None,
) -> Report:
    """Grade ``tests`` (pairs of original index and test dict) from sandbox output."""
    tol = {**DEFAULT_TOLERANCE, **spec.get("tolerance", {})}
    ret = spec["returns"]
    used_reference = used_reference or []

    outcomes: dict[int, TestOutcome] = {}
    for idx, test in tests:
        hidden = bool(test.get("hidden"))
        outcomes[idx] = TestOutcome(
            index=idx,
            description=test.get("description", ""),
            hidden=hidden,
            status="not_run",
            args=None if hidden else [describe_arg(p["type"], a) for p, a in zip(spec["params"], test["args"])],
            expected=None if test.get("expect_error") else test.get("expected"),
            expect_error=bool(test.get("expect_error")),
        )

    def finish(status: str, **kw: Any) -> Report:
        ordered = [outcomes[i] for i, _ in tests]
        passed = sum(1 for o in ordered if o.status == "pass")
        return Report(status=status, passed=passed, total=len(ordered), tests=ordered,
                      used_reference=used_reference, **kw)

    compile_step = job_result.step("compile")
    if compile_step is not None and (compile_step.exit_code != 0 or compile_step.timed_out):
        output, blames_harness = _compiler_output(compile_step.stderr + compile_step.stdout)
        if compile_step.timed_out:
            msg = "Compilation took too long and was stopped."
        else:
            msg = "Your code didn't compile. Fix the errors below and try again."
            if blames_harness:
                msg += " " + SIGNATURE_HINT
        return finish("compile_error", compile_output=output, message=msg)

    run = job_result.step("run")
    if run is None:
        return finish("crashed", message="The program never ran.")

    lines = _parse_lines(run.results)
    common = {"stdout": _clip(run.stdout), "stderr": _clip(run.stderr), "time_ms": run.time_ms}

    load_error = next((line for line in lines if line.get("kind") == "load_error"), None)
    if load_error:
        where = "an earlier library function" if load_error.get("where") == "library" else "your code"
        return finish(
            "load_error",
            compile_output=_clip(load_error.get("message", "")),
            message=f"There is an error in {where} before any test could run.",
            **common,
        )

    for line in lines:
        if line.get("kind") != "case" or line.get("case") not in outcomes:
            continue
        outcome = outcomes[line["case"]]
        if line["status"] == "ok":
            outcome.actual = line.get("value")
            if outcome.expect_error:
                outcome.status = "fail"
                outcome.message = "This input should cause an error, but your function returned a value."
            else:
                ok, why = compare(ret, outcome.expected, outcome.actual, tol)
                outcome.status = "pass" if ok else "fail"
                outcome.message = why
        else:
            not_implemented = bool(
                _NOT_IMPLEMENTED.search(line.get("message") or "")
                or _NOT_IMPLEMENTED.search(line.get("error_type") or "")
            )
            if outcome.expect_error and not not_implemented:
                outcome.status = "pass"
                outcome.message = f"Raised an error as expected ({line.get('error_type', 'error')})."
            else:
                outcome.status = "error"
                outcome.message = _error_message(line)
                outcome.detail = _clip(line.get("detail") or "", 4000)

    not_run = [o for o in outcomes.values() if o.status == "not_run"]
    if run.timed_out:
        for o in not_run:
            o.message = "Not run: the time limit was reached."
        return finish("timeout", message=f"Time limit exceeded ({spec.get('time_limit', 10)} s). "
                      "Check for infinite loops.", **common)
    if not_run:
        why = _signal_message(run.signal, run.exit_code)
        first = min(not_run, key=lambda o: o.index)
        first.status = "error"
        first.message = why
        for o in not_run:
            if o is not first:
                o.message = "Not run because the program stopped early."
        return finish("crashed", message=why, **common)

    report = finish("passed", **common)
    if report.passed != report.total:
        report.status = "failed"
    return report


# --------------------------------------------------------------------------
# Training runs (the capstone): one call, graded on what it reports
# --------------------------------------------------------------------------


@dataclass
class TrainingOutcome:
    # "ok" (the function returned) | "compile_error" | "load_error" | "error" | "crashed" | "timeout"
    status: str
    message: str = ""
    value: Any = None
    compile_output: str = ""
    detail: str = ""
    stdout: str = ""
    stderr: str = ""
    time_ms: int = 0


def grade_training(spec: dict[str, Any], job_result: JobResult, lines: list[dict[str, Any]]) -> TrainingOutcome:
    """Work out how a training run ended from its steps and its result lines
    (the "case" / "load_error" lines; progress and tensors are handled by the caller)."""
    compile_step = job_result.step("compile")
    if compile_step is not None and (compile_step.exit_code != 0 or compile_step.timed_out):
        output, blames_harness = _compiler_output(compile_step.stderr + compile_step.stdout)
        msg = "Compilation took too long and was stopped." if compile_step.timed_out else "Your code didn't compile."
        if blames_harness and not compile_step.timed_out:
            msg += " " + SIGNATURE_HINT
        return TrainingOutcome("compile_error", msg, compile_output=output)

    run = job_result.step("run")
    if run is None:
        return TrainingOutcome("crashed", "The program never ran.")
    common = {"stdout": _clip(run.stdout), "stderr": _clip(run.stderr), "time_ms": run.time_ms}

    load_error = next((line for line in lines if line.get("kind") == "load_error"), None)
    if load_error:
        where = "an earlier library function" if load_error.get("where") == "library" else "your code"
        return TrainingOutcome("load_error", f"There is an error in {where}, so training never started.",
                               compile_output=_clip(load_error.get("message", "")), **common)

    case = next((line for line in lines if line.get("kind") == "case"), None)
    if case is not None:
        if case.get("status") == "ok":
            return TrainingOutcome("ok", value=case.get("value"), **common)
        return TrainingOutcome("error", _error_message(case), detail=_clip(case.get("detail") or "", 4000), **common)
    if run.timed_out:
        return TrainingOutcome("timeout", f"Training didn't finish within the time limit ({spec.get('time_limit')} s). "
                               "Try fewer images or epochs.", **common)
    return TrainingOutcome("crashed", _signal_message(run.signal, run.exit_code), **common)
