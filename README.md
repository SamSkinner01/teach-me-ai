# TEACH-ME-AI

An interactive web app that teaches the math behind AI from first principles (linear algebra, then calculus) and has learners implement every piece themselves, in **Python, Rust or C++**, on the way to building a convolutional neural network for MNIST. See [`TEACH-ME-AI.md`](TEACH-ME-AI.md) for the full feature plan.

**What's built so far:** modules 0–3 (Orientation, Linear Algebra, Calculus, Probability & Statistics): 18 lessons, 36 exercises in all three languages, 16 interactive visualizations, and a draw-a-digit demo backed by a small CNN that runs in the browser. Modules 4–7 appear on the roadmap as "coming soon".

## How it fits together

```
frontend/        React + TypeScript (Vite). Lessons are MDX in src/lessons/,
                 visualizations in src/viz/, Monaco editor (self-hosted).
backend/         FastAPI + SQLite: accounts, tracks, progress, and the code runner.
  app/runner/    codegen.py  turns an exercise + learner code into a test program
                 sandbox.py  runs it in a throwaway Docker container
                 driver.py   the tiny script that runs inside the sandbox
                 grading.py  compares results with expected values (on the host)
content/         course.json (modules → lessons → exercises) and
                 exercises/<id>/ with exercise.json, starter.* and solution.*
runner-image/    Dockerfile for the sandbox (Fedora + python3, rustc, g++)
scripts/         content tooling, demo-model training, image build
```

Each exercise is written once, language-neutrally (function name, typed parameters, return type, JSON test cases). The backend generates a test harness in the learner's language that calls their function and writes results to a private file descriptor. Expected values never enter the sandbox. Each passing solution joins the learner's **library** and is compiled in ahead of later exercises.

## Running it

Prerequisites: Docker, [uv](https://docs.astral.sh/uv/), Node 22+.

```bash
# 1. Build the sandbox image (once)
scripts/build-runner-image.sh

# 2. Install dependencies
(cd backend && uv sync)
(cd frontend && npm install)
```

**Development** (two terminals, hot reload):

```bash
cd backend && uv run uvicorn --factory app.main:create_app --reload --port 8000
cd frontend && npm run dev          # http://localhost:5173 (proxies /api to :8000)
```

**Production-style** (one server):

```bash
(cd frontend && npm run build)      # writes frontend/dist, which the backend serves
cd backend && TMAI_SECURE_COOKIES=1 uv run uvicorn --factory app.main:create_app --host 0.0.0.0 --port 8000
```

Put it behind an HTTPS reverse proxy before exposing it to anyone (session cookies are `Secure` when `TMAI_SECURE_COOKIES=1`).

### Configuration

| Variable | Default | |
| --- | --- | --- |
| `TMAI_SANDBOX` | `docker` | `local` runs code directly on the host with only CPU/file-size limits. **Development only, never expose it.** |
| `TMAI_RUNNER_IMAGE` | `teach-me-ai-runner:latest` | |
| `TMAI_SANDBOX_MEMORY` | `768m` | per-run memory cap |
| `TMAI_MAX_CONCURRENT_RUNS` | `4` | sandboxes running at once (each user is limited to one) |
| `TMAI_DB_PATH` | `backend/data/teach-me-ai.db` | SQLite file |
| `TMAI_UNLOCK_ALL` | `0` | open every lesson without finishing the previous one (for content authors) |
| `TMAI_ALLOW_REGISTRATION` | `1` | set `0` to close sign-ups |
| `TMAI_SECURE_COOKIES` | `0` | set `1` when served over HTTPS |
| `TMAI_SOLUTION_AFTER_ATTEMPTS` | `3` | submissions before the reference solution unlocks |

## Security model

Learner code is untrusted. Each run gets a fresh container with `--network none`, a read-only root filesystem, a size-limited tmpfs, all capabilities dropped, `no-new-privileges`, a non-root user, and memory, CPU and PID limits, plus wall-clock timeouts for compiling and running. Passwords are hashed with scrypt; sessions are random tokens (stored hashed) in an HttpOnly, SameSite=Lax cookie; all writes must be JSON, which blocks cross-site form posts; logins are rate-limited.

A learner *can* forge their own test results from inside the sandbox (the harness and their code share a process). That only affects their own progress, so it's accepted.

## Tests

```bash
cd backend && uv run pytest              # API, auth, grading, runner (local + Docker)
cd frontend && npm test && npm run typecheck
uv run --project backend python scripts/verify_content.py
cd e2e && npm install && npm test        # browser test; needs the app running (see below)
```

The e2e test drives a real Chrome (`CHROME_PATH`, default `/usr/bin/google-chrome`) against `E2E_BASE_URL` (default the Vite dev server on `:5173`). It signs up a new learner, completes lessons in order through the UI with lesson locking **on**, passes an exercise in the sandbox, and fails on any page error or blank lesson. Run it against both the dev server and a production build before releasing.

`verify_content.py` runs every exercise's reference solution, in all three languages, through the real sandbox (it must pass every test), and checks that each starter compiles but passes nothing.

## Adding an exercise

1. Create `content/exercises/<id>/` with `exercise.json` (see an existing one), `starter.{py,rs,cpp}` and `solution.{py,rs,cpp}`. Leave `expected` out of the tests.
2. List the id under a lesson in `content/course.json`.
3. `uv run --project backend python scripts/fill_expected.py` computes expected values from the Python solution.
4. `uv run --project backend python scripts/verify_content.py <id>` checks all three languages.
5. Reference it in the lesson's MDX: `<Exercise id="<id>">prompt…</Exercise>`.

Supported parameter types: `float`, `int`, `bool`, `vec`, `mat`, `ivec`, plus `fn1` / `fnv` (functions chosen from a named list in `codegen.py`). Return types: the first six.

## The demo model

`frontend/public/models/demo-cnn.json` (about 5k parameters, 98.4% MNIST test accuracy) was trained with `uv run --with numpy python scripts/train_demo_model.py`, which also downloads MNIST into `data/` (git-ignored). The browser inference in `frontend/src/viz/cnn.ts` is tested against that script's outputs.
