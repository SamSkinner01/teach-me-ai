"""Fill in missing `expected` values in content/exercises/*/exercise.json.

Expected values come from running the Python reference solutions (with the
reference solutions of earlier exercises as their library). Tests marked
`expect_error` are checked to really raise. Existing expected values are left
alone unless --force is given.

    uv run --project backend python scripts/fill_expected.py [--force]
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.course import Course  # noqa: E402
from app.runner.codegen import FN1, FNV  # noqa: E402


def to_arg(type_, value):
    if type_ == "fn1":
        return eval(f"lambda x: {FN1[value['fn']]['python']}", {"math": math})
    if type_ == "fnv":
        return eval(f"lambda x: {FNV[value['fn']]['python']}", {"math": math})
    if type_ == "vec":
        return [float(x) for x in value]
    if type_ == "mat":
        return [[float(x) for x in row] for row in value]
    if type_ == "float":
        return float(value)
    return value


def normalize(type_, value):
    if type_ == "float":
        return float(value)
    if type_ == "vec":
        return [float(x) for x in value]
    if type_ == "mat":
        return [[float(x) for x in row] for row in value]
    return value


def main():
    force = "--force" in sys.argv
    course = Course.load(ROOT / "content", require_expected=False)
    changed = 0
    for ex_id in course.exercise_order:
        ex = course.exercises[ex_id]
        ns = {"__name__": "reference"}
        for lib in course.library_before(ex_id):
            exec(compile(lib.solutions["python"], f"{lib.id}/solution.py", "exec"), ns)
        exec(compile(ex.solutions["python"], f"{ex_id}/solution.py", "exec"), ns)
        fn = ns[ex.function]

        path = ROOT / "content" / "exercises" / ex_id / "exercise.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        for i, test in enumerate(data["tests"]):
            args = [to_arg(p["type"], a) for p, a in zip(ex.params, test["args"])]
            if test.get("expect_error"):
                try:
                    fn(*args)
                except Exception:
                    continue
                raise SystemExit(f"{ex_id} test {i}: expected an error but the reference solution returned")
            if "expected" in test and not force:
                continue
            test["expected"] = normalize(ex.returns, fn(*args))
            changed += 1
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"filled {changed} expected values")


if __name__ == "__main__":
    main()
