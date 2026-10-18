# TEACH-ME-AI

An interactive web app that teaches the math behind AI from first principles (linear algebra, calculus, probability, optimization) and has learners implement every piece themselves, in **Python, Rust or C++**, ending with a convolutional neural network they train on MNIST. See [`TEACH-ME-AI.md`](TEACH-ME-AI.md) for the full feature plan.

**What's built:** the whole course, modules 0–7 (Orientation, Linear Algebra, Calculus, Probability & Statistics, Optimization, Neural Networks, Convolutional Neural Networks, and the MNIST capstone). That's 39 lessons, 79 exercises in all three languages, and 34 interactive figures. In the capstone, the learner's own CNN, assembled from their library, trains on the real MNIST files in the sandbox while a live dashboard shows its learning curves. With the reference solution it reaches 97.5% test accuracy in about 15 seconds in Rust or C++ (all 60,000 images), or 93% in Python (5,000 images). The learner then explores their network's confusion matrix and mistakes, and draws digits for it in the browser.

## How it fits together

```
frontend/        React + TypeScript (Vite). Lessons are MDX in src/lessons/,
                 visualizations in src/viz/, Monaco editor (self-hosted).
backend/         FastAPI + SQLite: accounts, tracks, progress, and the code runner.
  app/runner/    codegen.py  turns an exercise + learner code into a test program
                 sandbox.py  runs it in a throwaway Docker container
                 driver.py   the tiny script that runs inside the sandbox
                 grading.py  compares results with expected values (on the host)
  app/training.py  capstone training runs: queue, streamed progress, grading, models
content/         course.json (modules → lessons → exercises) and
                 exercises/<id>/ with exercise.json, starter.* and solution.*
runner-image/    Dockerfile for the sandbox (Fedora + python3, rustc, g++, MNIST)
scripts/         content tooling, MNIST download, demo-model training, image build
data/mnist/      MNIST, downloaded by scripts/fetch_mnist.py (git-ignored)
```

Each exercise is written once, language-neutrally (function name, typed parameters, return type, JSON test cases). The backend generates a test harness in the learner's language that calls their function and writes results to a private file descriptor. Expected values never enter the sandbox. Each passing solution joins the learner's **library** and is compiled in ahead of later exercises.

## Running it

Prerequisites: Docker, [uv](https://docs.astral.sh/uv/), Node 22+.

```bash
# 1. Download MNIST (55 MB) and build the sandbox image with it inside (once)
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
| `TMAI_TRAINING_MEMORY` | `2g` | memory cap for a capstone training run |
| `TMAI_MAX_CONCURRENT_TRAININGS` | `1` | training runs at once; more wait in a queue (8 at most), and each user can have one |
| `TMAI_MNIST_DIR` | `data/mnist/raw` | uncompressed MNIST files. The backend reads the test labels (for grading) and test images (for the gallery and dataset viewer) from here; the local sandbox reads everything |

## Security model

Learner code is untrusted. Each run gets a fresh container with `--network none`, a read-only root filesystem, a size-limited tmpfs, all capabilities dropped, `no-new-privileges`, a non-root user, and memory, CPU and PID limits, plus wall-clock timeouts for compiling and running. Passwords are hashed with scrypt; sessions are random tokens (stored hashed) in an HttpOnly, SameSite=Lax cookie; all writes must be JSON, which blocks cross-site form posts; logins are rate-limited.

Capstone training runs use the same container restrictions with a larger memory cap (`TMAI_TRAINING_MEMORY`) and a longer, per-language time limit (10 min for Rust/C++, 20 min for Python). Only one runs at a time by default; the rest queue. Progress, predictions and weights stream back over the results pipe with a total size cap, and the backend ignores anything malformed or oversized. Test accuracy is computed by the backend from the reported predictions and the real labels, so it doesn't rely on the number the learner's function returns.

A learner *can* forge their own test results from inside the sandbox (the harness and their code share a process), and could report the test labels as predictions (the files are readable in the sandbox). That only affects their own progress, so it's accepted.

## Tests

```bash
python3 scripts/fetch_mnist.py           # the training tests need MNIST
cd backend && uv run pytest              # API, auth, grading, runner (local + Docker), training runs
cd frontend && npm test && npm run typecheck
uv run --project backend python scripts/verify_content.py
cd e2e && npm install && npm test        # browser test; needs the app running (see below)
cd e2e && npm run capstone               # a real training run in the browser (unlock-all server)
```

The e2e test drives a real Chrome (`CHROME_PATH`, default `/usr/bin/google-chrome`) against `E2E_BASE_URL` (default the Vite dev server on `:5173`). It signs up a new learner, completes lessons in order through the UI with lesson locking **on**, passes an exercise in the sandbox, and fails on any page error or blank lesson. Run it against both the dev server and a production build before releasing.

`npm run capstone` needs a second backend started with `TMAI_UNLOCK_ALL=1` (`E2E_UNLOCKED_URL`, default `http://localhost:8001`) so the capstone is open to a new account. It runs the training starter and then the reference solution from the browser (`E2E_LANGUAGE`, default `rust`), and checks the live curves, the result, the confusion matrix and gallery, and that the trained model reads a drawn digit.

`verify_content.py` runs every exercise's reference solution, in all three languages, through the real sandbox (it must pass every test), and checks that each starter compiles but passes nothing. For the capstone training exercise it runs a short training job instead: the reference must beat chance and save a usable model, and the starter must stop at its TODO.

## Adding an exercise

1. Create `content/exercises/<id>/` with `exercise.json` (see an existing one), `starter.{py,rs,cpp}` and `solution.{py,rs,cpp}`. Leave `expected` out of the tests.
2. List the id under a lesson in `content/course.json`.
3. `uv run --project backend python scripts/fill_expected.py` computes expected values from the Python solution.
4. `uv run --project backend python scripts/verify_content.py <id>` checks all three languages.
5. Reference it in the lesson's MDX: `<Exercise id="<id>">prompt…</Exercise>`.

Supported parameter types: `float`, `int`, `bool`, `vec`, `mat`, `ivec`, `str`, `bytes`, plus `fn1` / `fnv` (functions chosen from a named list in `codegen.py`). Return types: `float`, `int`, `bool`, `vec`, `mat`, `ivec`.

A **training exercise** (`"kind": "training"`, like `cap-train`) has no tests. Instead it has per-language `training` settings: default and maximum images and epochs, learning rate, batch size, test-set size, pass threshold and time limit. It is shown with `<TrainingLab id="…">`, and its code can call `report_progress`, `report_predictions` and `save_tensor`.

## The demo model

`frontend/public/models/demo-cnn.json` (about 5k parameters, 98.4% MNIST test accuracy) was trained with `uv run --with numpy python scripts/train_demo_model.py`, which also downloads MNIST into `data/mnist/` (git-ignored). The browser inference in `frontend/src/viz/cnn.ts` is tested against that script's outputs.
