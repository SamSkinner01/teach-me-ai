"""Builds a sandbox job (source files + build/run steps) for one language.

Each exercise is described once, language-neutrally: a function name, typed
parameters, a return type, and test cases whose arguments are plain JSON. This
module generates a test harness in Python, Rust or C++ that calls the
learner's function with those arguments and writes each result as one JSON
line to file descriptor 3. Grading (comparing against expected values) happens
on the host, so expected values never enter the sandbox.

Supported types:
    float, int, bool       scalars (int maps to usize / std::size_t)
    vec                    1-D list of floats
    mat                    2-D list of floats (list of rows)
    ivec                   1-D list of non-negative ints (shapes, indices)
    fn1                    a function float -> float, given by name (see FN1)
    fnv                    a function vec -> float, given by name (see FNV)
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any

LANGUAGES = ("python", "rust", "cpp")

# Functions that tests can pass as arguments. Each needs an expression in
# terms of `x` for every language, and a label shown to the learner.
FN1: dict[str, dict[str, str]] = {
    "square": {"label": "f(x) = x²", "python": "x * x", "rust": "x * x", "cpp": "x * x"},
    "cube": {"label": "f(x) = x³", "python": "x * x * x", "rust": "x * x * x", "cpp": "x * x * x"},
    "poly": {
        "label": "f(x) = 3x² − 2x + 1",
        "python": "3.0 * x * x - 2.0 * x + 1.0",
        "rust": "3.0 * x * x - 2.0 * x + 1.0",
        "cpp": "3.0 * x * x - 2.0 * x + 1.0",
    },
    "sin": {"label": "f(x) = sin(x)", "python": "math.sin(x)", "rust": "x.sin()", "cpp": "std::sin(x)"},
    "cos": {"label": "f(x) = cos(x)", "python": "math.cos(x)", "rust": "x.cos()", "cpp": "std::cos(x)"},
    "exp": {"label": "f(x) = eˣ", "python": "math.exp(x)", "rust": "x.exp()", "cpp": "std::exp(x)"},
    "log": {"label": "f(x) = ln(x)", "python": "math.log(x)", "rust": "x.ln()", "cpp": "std::log(x)"},
    "abs": {"label": "f(x) = |x|", "python": "abs(x)", "rust": "x.abs()", "cpp": "std::fabs(x)"},
}

FNV: dict[str, dict[str, str]] = {
    "sum_squares": {
        "label": "f(x) = Σ xᵢ²",
        "python": "sum(t * t for t in x)",
        "rust": "x.iter().map(|t| t * t).sum::<f64>()",
        "cpp": "std::accumulate(x.begin(), x.end(), 0.0, [](double s, double t) { return s + t * t; })",
    },
    "bowl": {
        "label": "f(x, y) = (x − 1)² + 2(y + 2)²",
        "python": "(x[0] - 1.0) ** 2 + 2.0 * (x[1] + 2.0) ** 2",
        "rust": "(x[0] - 1.0).powi(2) + 2.0 * (x[1] + 2.0).powi(2)",
        "cpp": "std::pow(x[0] - 1.0, 2) + 2.0 * std::pow(x[1] + 2.0, 2)",
    },
    "rosenbrock": {
        "label": "f(x, y) = (1 − x)² + 100(y − x²)²",
        "python": "(1.0 - x[0]) ** 2 + 100.0 * (x[1] - x[0] ** 2) ** 2",
        "rust": "(1.0 - x[0]).powi(2) + 100.0 * (x[1] - x[0].powi(2)).powi(2)",
        "cpp": "std::pow(1.0 - x[0], 2) + 100.0 * std::pow(x[1] - std::pow(x[0], 2), 2)",
    },
    "mixed": {
        "label": "f(x, y, z) = xy + sin(z)",
        "python": "x[0] * x[1] + math.sin(x[2])",
        "rust": "x[0] * x[1] + x[2].sin()",
        "cpp": "x[0] * x[1] + std::sin(x[2])",
    },
    "valley": {
        "label": "f(x, y) = 0.1x² + 2y²",
        "python": "0.1 * x[0] * x[0] + 2.0 * x[1] * x[1]",
        "rust": "0.1 * x[0] * x[0] + 2.0 * x[1] * x[1]",
        "cpp": "0.1 * x[0] * x[0] + 2.0 * x[1] * x[1]",
    },
    "linear": {
        "label": "f(x) = 2x₀ − 3x₁ + 0.5x₂",
        "python": "2.0 * x[0] - 3.0 * x[1] + 0.5 * x[2]",
        "rust": "2.0 * x[0] - 3.0 * x[1] + 0.5 * x[2]",
        "cpp": "2.0 * x[0] - 3.0 * x[1] + 0.5 * x[2]",
    },
}

TYPES = ("float", "int", "bool", "vec", "mat", "ivec", "fn1", "fnv")


@dataclass
class LibraryEntry:
    """One earlier exercise's code, compiled in ahead of the learner's solution."""

    exercise_id: str
    code: str


@dataclass
class Job:
    files: dict[str, str]
    steps: list[dict[str, Any]]
    # Which source file holds the learner's code, for error messages.
    solution_file: str
    extra: dict[str, Any] = field(default_factory=dict)


def ident(exercise_id: str) -> str:
    """Exercise id -> identifier usable as a file / module name."""
    return re.sub(r"[^0-9a-zA-Z_]", "_", exercise_id)


def describe_arg(type_: str, value: Any) -> Any:
    """How an argument is shown to the learner in test results."""
    if type_ in ("fn1", "fnv"):
        table = FN1 if type_ == "fn1" else FNV
        return {"fn": table[value["fn"]]["label"]}
    return value


# --------------------------------------------------------------------------
# Literals
# --------------------------------------------------------------------------


def _float_repr(x: Any) -> str:
    return repr(float(x))


def _py_literal(type_: str, value: Any) -> str:
    if type_ == "float":
        x = float(value)
        if math.isnan(x):
            return "float('nan')"
        if math.isinf(x):
            return "float('inf')" if x > 0 else "float('-inf')"
        return repr(x)
    if type_ == "int":
        return str(int(value))
    if type_ == "bool":
        return "True" if value else "False"
    if type_ == "vec":
        return "[" + ", ".join(_py_literal("float", x) for x in value) + "]"
    if type_ == "ivec":
        return "[" + ", ".join(str(int(x)) for x in value) + "]"
    if type_ == "mat":
        return "[" + ", ".join(_py_literal("vec", row) for row in value) + "]"
    if type_ == "fn1":
        return f"(lambda x: {FN1[value['fn']]['python']})"
    if type_ == "fnv":
        return f"(lambda x: {FNV[value['fn']]['python']})"
    raise ValueError(f"unknown type {type_}")


def _rs_float(value: Any) -> str:
    x = float(value)
    if math.isnan(x):
        return "f64::NAN"
    if math.isinf(x):
        return "f64::INFINITY" if x > 0 else "f64::NEG_INFINITY"
    return _float_repr(x)


def _rs_literal(type_: str, value: Any) -> str:
    if type_ == "float":
        return _rs_float(value)
    if type_ == "int":
        return f"{int(value)}usize"
    if type_ == "bool":
        return "true" if value else "false"
    if type_ == "vec":
        items = ", ".join(_rs_float(x) for x in value)
        return f"&{{ let v: Vec<f64> = vec![{items}]; v }}"
    if type_ == "ivec":
        items = ", ".join(f"{int(x)}" for x in value)
        return f"&{{ let v: Vec<usize> = vec![{items}]; v }}"
    if type_ == "mat":
        rows = ", ".join("vec![" + ", ".join(_rs_float(x) for x in row) + "]" for row in value)
        return f"&{{ let m: Vec<Vec<f64>> = vec![{rows}]; m }}"
    if type_ == "fn1":
        return f"|x: f64| -> f64 {{ {FN1[value['fn']]['rust']} }}"
    if type_ == "fnv":
        return f"|x: &[f64]| -> f64 {{ {FNV[value['fn']]['rust']} }}"
    raise ValueError(f"unknown type {type_}")


def _cpp_float(value: Any) -> str:
    x = float(value)
    if math.isnan(x):
        return "std::numeric_limits<double>::quiet_NaN()"
    if math.isinf(x):
        return ("" if x > 0 else "-") + "std::numeric_limits<double>::infinity()"
    return _float_repr(x)


def _cpp_literal(type_: str, value: Any) -> str:
    if type_ == "float":
        return _cpp_float(value)
    if type_ == "int":
        return f"std::size_t{{{int(value)}}}"
    if type_ == "bool":
        return "true" if value else "false"
    if type_ == "vec":
        return "std::vector<double>{" + ", ".join(_cpp_float(x) for x in value) + "}"
    if type_ == "ivec":
        return "std::vector<std::size_t>{" + ", ".join(f"{int(x)}" for x in value) + "}"
    if type_ == "mat":
        rows = ", ".join(_cpp_literal("vec", row) for row in value)
        return "std::vector<std::vector<double>>{" + rows + "}"
    if type_ == "fn1":
        return f"[](double x) -> double {{ return {FN1[value['fn']]['cpp']}; }}"
    if type_ == "fnv":
        return f"[](const std::vector<double>& x) -> double {{ return {FNV[value['fn']]['cpp']}; }}"
    raise ValueError(f"unknown type {type_}")


# --------------------------------------------------------------------------
# Python
# --------------------------------------------------------------------------

_PY_HARNESS = r'''
import io
import json
import math
import os
import sys
import traceback

try:
    _RESULTS = os.fdopen(3, "w", encoding="utf-8")
except OSError:
    _RESULTS = sys.stderr

_USER_FILES = set(__LIB_FILES__) | {"solution.py"}


def _emit(obj):
    _RESULTS.write(json.dumps(obj) + "\n")
    _RESULTS.flush()


def _user_traceback(exc):
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename in _USER_FILES]
    lines = traceback.format_list(frames)
    lines += traceback.format_exception_only(type(exc), exc)
    return "".join(lines).rstrip()


def _jsonable(value):
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return value
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    try:
        return [_jsonable(v) for v in list(value)]
    except TypeError:
        return {"__repr__": repr(value)[:200], "__type__": type(value).__name__}


def _load(path, ns, quiet):
    with open(path, encoding="utf-8") as f:
        source = f.read()
    code = compile(source, path, "exec")
    if quiet:
        saved, sys.stdout = sys.stdout, io.StringIO()
        try:
            exec(code, ns)
        finally:
            sys.stdout = saved
    else:
        exec(code, ns)


_ns = {"__name__": "__main__", "__builtins__": __builtins__}
_where = "library"
try:
    for _path in __LIB_FILES__:
        _load(_path, _ns, True)
    _where = "solution"
    _load("solution.py", _ns, False)
except BaseException as _exc:
    if isinstance(_exc, SyntaxError) and _exc.filename in _USER_FILES:
        _msg = "".join(traceback.format_exception_only(type(_exc), _exc)).rstrip()
    else:
        _msg = _user_traceback(_exc)
    _emit({"kind": "load_error", "where": _where, "message": _msg})
    sys.exit(0)

_fn = _ns.get(__FUNC__)
if not callable(_fn):
    _emit({"kind": "load_error", "where": "solution",
           "message": "Your code does not define a function named `%s`." % __FUNC__})
    sys.exit(0)

__CASES__

for _i, _make_args in _CASES:
    try:
        _value = _fn(*_make_args())
        _emit({"kind": "case", "case": _i, "status": "ok", "value": _jsonable(_value)})
    except BaseException as _exc:
        _emit({"kind": "case", "case": _i, "status": "error",
               "error_type": type(_exc).__name__, "message": str(_exc),
               "detail": _user_traceback(_exc)})
'''


def _python_job(spec, cases, solution, library) -> Job:
    files: dict[str, str] = {"solution.py": solution}
    lib_files = []
    for entry in library:
        path = f"lib/{ident(entry.exercise_id)}.py"
        files[path] = entry.code
        lib_files.append(path)

    case_lines = ["_CASES = ["]
    for idx, args in cases:
        literals = [_py_literal(p["type"], a) for p, a in zip(spec["params"], args)]
        tuple_src = "(" + "".join(lit + ", " for lit in literals) + ")"
        case_lines.append(f"    ({idx}, lambda: {tuple_src}),")
    case_lines.append("]")

    harness = (
        _PY_HARNESS.replace("__LIB_FILES__", repr(lib_files))
        .replace("__FUNC__", repr(spec["function"]))
        .replace("__CASES__", "\n".join(case_lines))
    )
    files["harness.py"] = harness
    steps = [
        {
            "name": "run",
            "cmd": ["python3", "-I", "-X", "utf8", "harness.py"],
            "timeout": spec.get("time_limit", 10),
            "results_fd": True,
        }
    ]
    return Job(files=files, steps=steps, solution_file="solution.py")


# --------------------------------------------------------------------------
# Rust
# --------------------------------------------------------------------------

_RS_TYPES = {
    "float": "f64",
    "int": "usize",
    "bool": "bool",
    "vec": "Vec<f64>",
    "mat": "Vec<Vec<f64>>",
    "ivec": "Vec<usize>",
}

_RS_FORMAT = {
    "float": "__tmai::f64_(__r)",
    "int": "__tmai::int_(__r)",
    "bool": "__tmai::bool_(__r)",
    "vec": "__tmai::vec_(&__r)",
    "mat": "__tmai::mat_(&__r)",
    "ivec": "__tmai::ivec_(&__r)",
}

_RS_SUPPORT = r'''
mod __tmai {
    use std::cell::RefCell;
    use std::io::Write;

    thread_local! {
        pub static LAST_PANIC: RefCell<Option<String>> = RefCell::new(None);
    }

    pub struct Out {
        file: Box<dyn Write>,
    }

    impl Out {
        pub fn new() -> Out {
            use std::os::fd::FromRawFd;
            // fd 3 is the results pipe set up by the sandbox driver.
            let file = unsafe { std::fs::File::from_raw_fd(3) };
            Out { file: Box::new(file) }
        }

        pub fn ok(&mut self, case: usize, value: String) {
            let _ = writeln!(self.file, "{{\"kind\":\"case\",\"case\":{},\"status\":\"ok\",\"value\":{}}}", case, value);
            let _ = self.file.flush();
        }

        pub fn err(&mut self, case: usize, payload: Box<dyn std::any::Any + Send>) {
            let msg = if let Some(s) = payload.downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = payload.downcast_ref::<String>() {
                s.clone()
            } else {
                "panic".to_string()
            };
            let location = LAST_PANIC.with(|p| p.borrow_mut().take()).unwrap_or_default();
            let _ = writeln!(
                self.file,
                "{{\"kind\":\"case\",\"case\":{},\"status\":\"error\",\"error_type\":\"panic\",\"message\":{},\"detail\":{}}}",
                case,
                esc(&msg),
                esc(&location)
            );
            let _ = self.file.flush();
        }
    }

    pub fn install_panic_hook() {
        std::panic::set_hook(Box::new(|info| {
            let location = info
                .location()
                .map(|l| format!("panicked at {}:{}:{}", l.file(), l.line(), l.column()))
                .unwrap_or_default();
            LAST_PANIC.with(|p| *p.borrow_mut() = Some(location));
        }));
    }

    pub fn esc(s: &str) -> String {
        let mut out = String::with_capacity(s.len() + 2);
        out.push('"');
        for c in s.chars() {
            match c {
                '"' => out.push_str("\\\""),
                '\\' => out.push_str("\\\\"),
                '\n' => out.push_str("\\n"),
                '\r' => out.push_str("\\r"),
                '\t' => out.push_str("\\t"),
                c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
                c => out.push(c),
            }
        }
        out.push('"');
        out
    }

    pub fn f64_(x: f64) -> String {
        if x.is_nan() {
            "NaN".to_string()
        } else if x.is_infinite() {
            if x > 0.0 { "Infinity".to_string() } else { "-Infinity".to_string() }
        } else {
            format!("{:?}", x)
        }
    }

    pub fn int_(x: usize) -> String {
        x.to_string()
    }

    pub fn bool_(b: bool) -> String {
        b.to_string()
    }

    pub fn vec_(v: &[f64]) -> String {
        format!("[{}]", v.iter().map(|x| f64_(*x)).collect::<Vec<_>>().join(","))
    }

    pub fn ivec_(v: &[usize]) -> String {
        format!("[{}]", v.iter().map(|x| x.to_string()).collect::<Vec<_>>().join(","))
    }

    pub fn mat_(m: &[Vec<f64>]) -> String {
        format!("[{}]", m.iter().map(|row| vec_(row)).collect::<Vec<_>>().join(","))
    }
}
'''


def _rust_job(spec, cases, solution, library) -> Job:
    files: dict[str, str] = {"solution.rs": solution}
    head = [
        "#![allow(unused, dead_code, non_snake_case, non_camel_case_types, unused_imports, unused_mut, unused_variables)]",
        "",
    ]
    for entry in library:
        name = ident(entry.exercise_id)
        path = f"lib/{name}.rs"
        files[path] = entry.code
        head.append(f'mod __lib_{name} {{ use super::*; include!("{path}"); }}')
        head.append(f"pub use __lib_{name}::*;")
    head.append("")
    head.append('include!("solution.rs");')

    ret = spec["returns"]
    body = [
        "fn main() {",
        "    __tmai::install_panic_hook();",
        "    let mut __out = __tmai::Out::new();",
    ]
    for idx, args in cases:
        literals = [_rs_literal(p["type"], a) for p, a in zip(spec["params"], args)]
        call = f"{spec['function']}({', '.join(literals)})"
        body.append(
            "    match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| -> String { "
            f"let __r: {_RS_TYPES[ret]} = {call}; {_RS_FORMAT[ret]} "
            "})) {"
        )
        body.append(f"        Ok(v) => __out.ok({idx}, v),")
        body.append(f"        Err(e) => __out.err({idx}, e),")
        body.append("    }")
    body.append("}")

    files["main.rs"] = "\n".join(head) + "\n" + _RS_SUPPORT + "\n" + "\n".join(body) + "\n"
    steps = [
        {
            "name": "compile",
            "cmd": ["rustc", "--edition", "2024", "-O", "-C", "debuginfo=0", "-o", "main", "main.rs"],
            "timeout": 60,
        },
        {
            "name": "run",
            "cmd": ["./main"],
            "timeout": spec.get("time_limit", 10),
            "results_fd": True,
        },
    ]
    return Job(files=files, steps=steps, solution_file="solution.rs")


# --------------------------------------------------------------------------
# C++
# --------------------------------------------------------------------------

CPP_PRELUDE = """// Standard headers included for every exercise. Only the standard library is allowed.
#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <iostream>
#include <limits>
#include <numeric>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>
"""

_CPP_TYPES = {
    "float": "double",
    "int": "std::size_t",
    "bool": "bool",
    "vec": "std::vector<double>",
    "mat": "std::vector<std::vector<double>>",
    "ivec": "std::vector<std::size_t>",
}

_CPP_FORMAT = {
    "float": "tmai_::f64(r)",
    "int": "tmai_::integer(r)",
    "bool": "tmai_::boolean(r)",
    "vec": "tmai_::vec(r)",
    "mat": "tmai_::mat(r)",
    "ivec": "tmai_::ivec(r)",
}

_CPP_SUPPORT = r'''
#include <charconv>
#include <cstdlib>
#include <cstdio>
#include <cxxabi.h>
#include <exception>
#include <typeinfo>

namespace tmai_ {

static std::FILE* out = nullptr;

inline void open() {
    out = fdopen(3, "w");  // results pipe set up by the sandbox driver
    if (!out) out = stderr;
}

inline std::string esc(const std::string& s) {
    std::string r = "\"";
    for (unsigned char c : s) {
        switch (c) {
            case '"': r += "\\\""; break;
            case '\\': r += "\\\\"; break;
            case '\n': r += "\\n"; break;
            case '\r': r += "\\r"; break;
            case '\t': r += "\\t"; break;
            default:
                if (c < 0x20) {
                    char buf[8];
                    std::snprintf(buf, sizeof buf, "\\u%04x", c);
                    r += buf;
                } else {
                    r += static_cast<char>(c);
                }
        }
    }
    return r + "\"";
}

inline std::string f64(double x) {
    if (std::isnan(x)) return "NaN";
    if (std::isinf(x)) return x > 0 ? "Infinity" : "-Infinity";
    char buf[64];
    auto res = std::to_chars(buf, buf + sizeof buf, x);
    return std::string(buf, res.ptr);
}

inline std::string integer(std::size_t x) { return std::to_string(x); }
inline std::string boolean(bool b) { return b ? "true" : "false"; }

inline std::string vec(const std::vector<double>& v) {
    std::string r = "[";
    for (std::size_t i = 0; i < v.size(); ++i) r += (i ? "," : "") + f64(v[i]);
    return r + "]";
}

inline std::string ivec(const std::vector<std::size_t>& v) {
    std::string r = "[";
    for (std::size_t i = 0; i < v.size(); ++i) r += (i ? "," : "") + integer(v[i]);
    return r + "]";
}

inline std::string mat(const std::vector<std::vector<double>>& m) {
    std::string r = "[";
    for (std::size_t i = 0; i < m.size(); ++i) r += (i ? "," : "") + vec(m[i]);
    return r + "]";
}

inline void ok(int c, const std::string& v) {
    std::fprintf(out, "{\"kind\":\"case\",\"case\":%d,\"status\":\"ok\",\"value\":%s}\n", c, v.c_str());
    std::fflush(out);
}

inline std::string demangle(const char* name) {
    int status = 0;
    char* d = abi::__cxa_demangle(name, nullptr, nullptr, &status);
    std::string r = (status == 0 && d) ? d : name;
    std::free(d);
    return r;
}

inline void err(int c, const std::string& type, const std::string& msg) {
    std::fprintf(out, "{\"kind\":\"case\",\"case\":%d,\"status\":\"error\",\"error_type\":%s,\"message\":%s}\n",
                 c, esc(type).c_str(), esc(msg).c_str());
    std::fflush(out);
}

}  // namespace tmai_
'''


def _cpp_job(spec, cases, solution, library) -> Job:
    files: dict[str, str] = {"solution.cpp": solution, "prelude.hpp": CPP_PRELUDE}
    head = ['#include "prelude.hpp"']
    for entry in library:
        path = f"lib/{ident(entry.exercise_id)}.cpp"
        files[path] = entry.code
        head.append(f'#include "{path}"')
    head.append('#include "solution.cpp"')

    ret = spec["returns"]
    body = ["int main() {", "    tmai_::open();"]
    for idx, args in cases:
        literals = [_cpp_literal(p["type"], a) for p, a in zip(spec["params"], args)]
        call = f"{spec['function']}({', '.join(literals)})"
        body.append("    try {")
        body.append(f"        {_CPP_TYPES[ret]} r = {call};")
        body.append(f"        tmai_::ok({idx}, {_CPP_FORMAT[ret]});")
        body.append("    } catch (const std::exception& e) {")
        body.append(f"        tmai_::err({idx}, tmai_::demangle(typeid(e).name()), e.what());")
        body.append("    } catch (...) {")
        body.append(f'        tmai_::err({idx}, "unknown", "a non-standard exception was thrown");')
        body.append("    }")
    body.append("    std::cout.flush();")
    body.append("    return 0;")
    body.append("}")

    files["main.cpp"] = "\n".join(head) + "\n" + _CPP_SUPPORT + "\n" + "\n".join(body) + "\n"
    steps = [
        {
            "name": "compile",
            "cmd": ["g++", "-std=c++20", "-O2", "-pipe", "-fdiagnostics-color=never", "-o", "main", "main.cpp"],
            "timeout": 60,
        },
        {
            "name": "run",
            "cmd": ["./main"],
            "timeout": spec.get("time_limit", 10),
            "results_fd": True,
        },
    ]
    return Job(files=files, steps=steps, solution_file="solution.cpp")


_BUILDERS = {"python": _python_job, "rust": _rust_job, "cpp": _cpp_job}


def build_job(
    language: str,
    spec: dict[str, Any],
    cases: list[tuple[int, list[Any]]],
    solution: str,
    library: list[LibraryEntry],
) -> Job:
    """Create the sandbox job that runs ``cases`` against ``solution``.

    ``cases`` is a list of (test index, argument list) pairs; the index is
    echoed back in each result so the host can match results to tests.
    """
    if language not in _BUILDERS:
        raise ValueError(f"unsupported language {language!r}")
    for p in spec["params"]:
        if p["type"] not in TYPES:
            raise ValueError(f"unsupported parameter type {p['type']!r}")
    if spec["returns"] not in _RS_TYPES:
        raise ValueError(f"unsupported return type {spec['returns']!r}")
    return _BUILDERS[language](spec, cases, solution, library)
