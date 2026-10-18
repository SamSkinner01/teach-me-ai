"""Check every exercise in every language through the real sandbox.

For each exercise and language:
  * the reference solution must pass every test (visible and hidden), using
    the reference solutions of earlier exercises as its library;
  * the starter code must compile/load and fail with "not implemented".

Training exercises run a short training job instead (200 images, needs
scripts/fetch_mnist.py): the reference must report predictions better than
chance and a usable model; the starter must load and stop at its TODO.

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
from app.runner.codegen import LANGUAGES, build_job  # noqa: E402
from app.runner.grading import grade_training  # noqa: E402
from app.training import Live, Mnist, build_model  # noqa: E402

TRAIN_ARGS = {"train_limit": 200, "test_limit": 100, "epochs": 1, "lr": 0.05, "batch_size": 10, "seed": 42}


async def train_once(runner, ex, lang, code, library):
    spec = {**ex.spec(), "time_limit": 300}
    a = TRAIN_ARGS
    args = [runner.sandbox.data_dir, a["train_limit"], a["test_limit"], a["epochs"], a["lr"], a["batch_size"], a["seed"]]
    job = build_job(lang, spec, [(0, args)], code, library, sdk=True)
    job.extra["memory"] = "2g"
    live = Live(run_id=0, user_id=0, epochs=1)
    async with runner._slots:
        result = await runner.sandbox.execute_stream(job, live.on_line)
    return live, grade_training(spec, result, live.result_lines)


async def check_training(runner, ex, lang, library):
    problems = []
    live, outcome = await train_once(runner, ex, lang, ex.solutions[lang], library)
    if outcome.status != "ok":
        problems.append(f"reference training {outcome.status}: {outcome.message} {outcome.compile_output[:1500]} "
                        f"{outcome.detail[:800]} {outcome.stderr[-800:]}")
    else:
        labels = Mnist(ROOT / "data" / "mnist" / "raw").labels()[: TRAIN_ARGS["test_limit"]]
        preds = live.predictions or []
        accuracy = sum(p == y for p, y in zip(preds, labels)) / len(labels)
        if len(preds) != len(labels) or accuracy < 0.3:
            problems.append(f"reference reported {len(preds)} predictions with accuracy {accuracy:.2f}")
        if build_model(live.tensors, accuracy)[0] is None:
            problems.append(f"reference saved no usable model: {build_model(live.tensors, accuracy)[1]}")
        if not live.points:
            problems.append("reference reported no progress")
    _, starter = await train_once(runner, ex, lang, ex.starters[lang], library)
    if starter.status != "error" or "Not implemented" not in starter.message:
        problems.append(f"starter should stop at its TODO, got {starter.status}: {starter.message} "
                        f"{starter.compile_output[:1500]}")
    return problems


async def check(runner, course, ex, lang):
    library = [LibraryEntry(lib.id, lib.solutions[lang]) for lib in course.library_before(ex.id)]
    if ex.kind == "training":
        return await check_training(runner, ex, lang, library)
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
    sandbox = DockerSandbox(settings.runner_image) if settings.sandbox == "docker" else LocalSandbox(settings.mnist_dir)
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
