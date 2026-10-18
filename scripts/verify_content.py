"""Check every exercise in every language through the real sandbox.

For each exercise and language:
  * the reference solution must pass every test (visible and hidden), using
    the reference solutions of earlier exercises as its library;
  * the starter code must compile/load and fail with "not implemented".

    uv run --project backend python scripts/verify_content.py [exercise-id ...]

Uses the sandbox selected by TMAI_SANDBOX (docker by default).
"""

import asyncio
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.config import Settings  # noqa: E402
from app.course import Course  # noqa: E402
from app.runner import DockerSandbox, LibraryEntry, LocalSandbox, Runner  # noqa: E402
from app.runner.codegen import LANGUAGES  # noqa: E402


async def check(runner, course, ex, lang):
    library = [LibraryEntry(lib.id, lib.solutions[lang]) for lib in course.library_before(ex.id)]
    tests = ex.indexed_tests(include_hidden=True)
    problems = []

    ref = await runner.run(lang, ex.spec(), ex.solutions[lang], tests, library)
    if ref.status != "passed":
        detail = ref.compile_output[:1500] or "; ".join(
            f"#{o.index} {o.status}: {o.message}" for o in ref.tests if o.status != "pass"
        )
        problems.append(f"reference solution {ref.status}: {ref.message} {detail}")

    starter = await runner.run(lang, ex.spec(), ex.starters[lang], tests, library)
    if starter.status in ("compile_error", "load_error"):
        problems.append(f"starter does not compile: {starter.compile_output[:1500]}")
    elif starter.passed:
        problems.append(f"starter passes {starter.passed} tests; it should pass none")
    return problems


async def main():
    settings = Settings.from_env()
    sandbox = DockerSandbox(settings.runner_image) if settings.sandbox == "docker" else LocalSandbox()
    runner = Runner(sandbox, max_concurrent=6)
    course = Course.load(ROOT / "content")
    wanted = sys.argv[1:] or course.exercise_order

    start = time.monotonic()
    jobs = [(course.exercises[e], lang) for e in wanted for lang in LANGUAGES]
    results = await asyncio.gather(*(check(runner, course, ex, lang) for ex, lang in jobs))
    failures = 0
    for (ex, lang), problems in zip(jobs, results):
        if problems:
            failures += 1
            for p in problems:
                print(f"FAIL {ex.id} [{lang}]: {p}")
    print(f"checked {len(jobs)} exercise/language pairs in {time.monotonic() - start:.1f}s: {failures} failing")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    asyncio.run(main())
