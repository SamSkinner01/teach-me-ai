"""HTTP API for TEACH-ME-AI.

Run with:  uv run uvicorn --factory app.main:create_app --reload
"""

from __future__ import annotations

import asyncio
import base64
import json
import re
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import auth, db
from .config import Settings
from .course import Course, Exercise
from .runner import DockerSandbox, LibraryEntry, LocalSandbox, Runner, Sandbox, SandboxError
from .runner.codegen import describe_arg
from .training import Mnist, TrainingManager, TrainingUnavailable

MAX_CODE = 100_000
CHECK_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")


class Credentials(BaseModel):
    username: str = Field(max_length=64)
    password: str = Field(max_length=auth.MAX_PASSWORD)


class PasswordBody(BaseModel):
    password: str = Field(max_length=auth.MAX_PASSWORD)


class CodeBody(BaseModel):
    code: str = Field(max_length=MAX_CODE)


class TrackBody(BaseModel):
    language: Literal["python", "rust", "cpp"]


class ActiveTrackBody(BaseModel):
    track_id: int


class TrainBody(BaseModel):
    code: str = Field(max_length=MAX_CODE)
    train_limit: int = Field(ge=100)
    epochs: int = Field(ge=1)
    lr: float = Field(gt=0, le=1)
    batch_size: int = Field(ge=1, le=512)
    seed: int = Field(ge=0, le=2**31 - 1)


def create_app(settings: Settings | None = None, sandbox: Sandbox | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    db.init(settings.db_path)
    course = Course.load(settings.content_dir)
    if sandbox is None:
        if settings.sandbox == "docker":
            sandbox = DockerSandbox(settings.runner_image, memory=settings.sandbox_memory)
        elif settings.sandbox == "local":
            sandbox = LocalSandbox(settings.mnist_dir)
        else:
            raise ValueError(f"TMAI_SANDBOX must be 'docker' or 'local', not {settings.sandbox!r}")
    runner = Runner(sandbox, settings.max_concurrent_runs)
    throttle = auth.LoginThrottle()
    run_locks: dict[int, asyncio.Lock] = {}
    mnist = Mnist(settings.mnist_dir)
    training = TrainingManager(
        sandbox, settings.db_path, mnist, settings.training_memory, settings.max_concurrent_trainings
    )
    startup_conn = db.connect(settings.db_path)
    try:
        training.recover(startup_conn)
    finally:
        startup_conn.close()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield
        await training.shutdown()

    app = FastAPI(
        title="TEACH-ME-AI", docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None, lifespan=lifespan
    )
    app.state.settings = settings
    app.state.course = course
    app.state.training = training

    # ------------------------------------------------------------------
    # Request plumbing
    # ------------------------------------------------------------------

    @app.middleware("http")
    async def require_json_for_writes(request: Request, call_next):
        # Cross-site HTML forms cannot send application/json without a CORS
        # preflight (which this API never approves), so this blocks CSRF.
        if request.url.path.startswith("/api/") and request.method in ("POST", "PUT", "PATCH", "DELETE"):
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("application/json"):
                return JSONResponse({"detail": "Requests must be JSON."}, status_code=415)
        return await call_next(request)

    def get_conn():
        conn = db.connect(settings.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def current_user(request: Request, conn: sqlite3.Connection = Depends(get_conn)) -> sqlite3.Row:
        user = auth.user_for_token(conn, request.cookies.get(auth.SESSION_COOKIE))
        if user is None:
            raise HTTPException(401, "Please log in.")
        return user

    def active_track(user: sqlite3.Row, conn: sqlite3.Connection) -> sqlite3.Row:
        track = None
        if user["active_track_id"] is not None:
            track = conn.execute(
                "SELECT * FROM tracks WHERE id = ? AND user_id = ?", (user["active_track_id"], user["id"])
            ).fetchone()
        if track is None:
            raise HTTPException(409, "Choose a language first.")
        return track

    def set_session_cookie(response: Response, token: str) -> None:
        response.set_cookie(
            auth.SESSION_COOKIE,
            token,
            max_age=settings.session_days * 86400,
            httponly=True,
            samesite="lax",
            secure=settings.secure_cookies,
            path="/",
        )

    # ------------------------------------------------------------------
    # Progress helpers
    # ------------------------------------------------------------------

    def completions(conn: sqlite3.Connection, track_id: int) -> set[str]:
        rows = conn.execute("SELECT item_id FROM completions WHERE track_id = ?", (track_id,))
        return {r["item_id"] for r in rows}

    def exercise_states(conn: sqlite3.Connection, track_id: int) -> dict[str, sqlite3.Row]:
        rows = conn.execute("SELECT * FROM exercise_state WHERE track_id = ?", (track_id,))
        return {r["exercise_id"]: r for r in rows}

    def lesson_unlocked(lesson_id: str, done: set[str]) -> bool:
        if settings.unlock_all:
            return True
        prev = course.previous_lesson(lesson_id)
        return prev is None or f"lesson:{prev}" in done

    def solution_available(state: sqlite3.Row | None) -> bool:
        if state is None:
            return False
        return state["passed_at"] is not None or state["attempts"] >= settings.solution_after_attempts

    def progress_payload(conn: sqlite3.Connection, track: sqlite3.Row) -> dict[str, Any]:
        done = completions(conn, track["id"])
        states = exercise_states(conn, track["id"])
        return {
            "track": {"id": track["id"], "language": track["language"]},
            "lessons": {
                lid: {"completed": f"lesson:{lid}" in done, "unlocked": lesson_unlocked(lid, done)}
                for lid in course.lesson_order
            },
            "exercises": {
                eid: {"passed": s["passed_at"] is not None, "attempts": s["attempts"]} for eid, s in states.items()
            },
            "checks": sorted(item[len("check:"):] for item in done if item.startswith("check:")),
        }

    def me_payload(conn: sqlite3.Connection, user: sqlite3.Row) -> dict[str, Any]:
        tracks = conn.execute(
            """SELECT tracks.*, (SELECT COUNT(*) FROM completions c
                                 WHERE c.track_id = tracks.id AND c.item_id LIKE 'lesson:%') AS lessons_completed
               FROM tracks WHERE user_id = ? ORDER BY created_at""",
            (user["id"],),
        ).fetchall()
        return {
            "user": {"id": user["id"], "username": user["username"]},
            "active_track_id": user["active_track_id"],
            "tracks": [
                {
                    "id": t["id"],
                    "language": t["language"],
                    "created_at": t["created_at"],
                    "lessons_completed": t["lessons_completed"],
                }
                for t in tracks
            ],
            "total_lessons": len(course.lesson_order),
        }

    def get_exercise(exercise_id: str) -> Exercise:
        ex = course.exercises.get(exercise_id)
        if ex is None:
            raise HTTPException(404, "No such exercise.")
        return ex

    def require_unlocked(conn: sqlite3.Connection, track: sqlite3.Row, lesson_id: str) -> None:
        if not lesson_unlocked(lesson_id, completions(conn, track["id"])):
            raise HTTPException(403, "Finish the previous lesson first.")

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    @app.post("/api/auth/register")
    def register(body: Credentials, response: Response, conn: sqlite3.Connection = Depends(get_conn)):
        if not settings.allow_registration:
            raise HTTPException(403, "Registration is closed.")
        error = auth.validate_credentials(body.username, body.password)
        if error:
            raise HTTPException(400, error)
        try:
            cur = conn.execute(
                "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
                (body.username, auth.hash_password(body.password), db.now()),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(409, "That username is taken.") from None
        conn.commit()
        set_session_cookie(response, auth.create_session(conn, cur.lastrowid, settings.session_days))
        user = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
        return me_payload(conn, user)

    @app.post("/api/auth/login")
    def login(body: Credentials, request: Request, response: Response, conn: sqlite3.Connection = Depends(get_conn)):
        key = body.username.lower()
        client = request.client.host if request.client else "?"
        if throttle.blocked(key) or throttle.blocked(client):
            raise HTTPException(429, "Too many failed attempts. Try again in a few minutes.")
        user = conn.execute("SELECT * FROM users WHERE username = ?", (body.username,)).fetchone()
        if user is None or not auth.verify_password(body.password, user["password_hash"]):
            throttle.failed(key)
            throttle.failed(client)
            raise HTTPException(401, "Wrong username or password.")
        throttle.succeeded(key)
        set_session_cookie(response, auth.create_session(conn, user["id"], settings.session_days))
        return me_payload(conn, user)

    @app.post("/api/auth/logout")
    def logout(request: Request, response: Response, conn: sqlite3.Connection = Depends(get_conn)):
        auth.delete_session(conn, request.cookies.get(auth.SESSION_COOKIE))
        response.delete_cookie(auth.SESSION_COOKIE, path="/")
        return {"ok": True}

    @app.get("/api/auth/session")
    def session(request: Request, conn: sqlite3.Connection = Depends(get_conn)):
        """Like /me, but 200 with null when logged out (no error for anonymous visitors)."""
        user = auth.user_for_token(conn, request.cookies.get(auth.SESSION_COOKIE))
        return {"me": me_payload(conn, user) if user else None}

    @app.get("/api/auth/me")
    def me(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        return me_payload(conn, user)

    @app.post("/api/auth/delete")
    def delete_account(
        body: PasswordBody, response: Response, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)
    ):
        if not auth.verify_password(body.password, user["password_hash"]):
            raise HTTPException(401, "Wrong password.")
        active = training.active_for_user(user["id"])
        if active is not None:
            training.cancel(active.run_id)
        conn.execute("DELETE FROM users WHERE id = ?", (user["id"],))
        conn.commit()
        response.delete_cookie(auth.SESSION_COOKIE, path="/")
        return {"ok": True}

    # ------------------------------------------------------------------
    # Course & tracks
    # ------------------------------------------------------------------

    @app.get("/api/health")
    async def health():
        ok, detail = await sandbox.check()
        return {"ok": ok, "sandbox": sandbox.name, "detail": detail, "mnist": mnist.available()}

    @app.get("/api/course")
    def get_course():
        return course.to_public()

    @app.post("/api/tracks")
    def start_track(body: TrackBody, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        existing = conn.execute(
            "SELECT id FROM tracks WHERE user_id = ? AND language = ?", (user["id"], body.language)
        ).fetchone()
        if existing:
            track_id = existing["id"]
        else:
            track_id = conn.execute(
                "INSERT INTO tracks (user_id, language, created_at) VALUES (?, ?, ?)",
                (user["id"], body.language, db.now()),
            ).lastrowid
        conn.execute("UPDATE users SET active_track_id = ? WHERE id = ?", (track_id, user["id"]))
        conn.commit()
        return me_payload(conn, conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone())

    @app.put("/api/tracks/active")
    def switch_track(body: ActiveTrackBody, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        track = conn.execute(
            "SELECT id FROM tracks WHERE id = ? AND user_id = ?", (body.track_id, user["id"])
        ).fetchone()
        if track is None:
            raise HTTPException(404, "No such track.")
        conn.execute("UPDATE users SET active_track_id = ? WHERE id = ?", (track["id"], user["id"]))
        conn.commit()
        return me_payload(conn, conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone())

    @app.get("/api/progress")
    def progress(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        return progress_payload(conn, active_track(user, conn))

    @app.post("/api/lessons/{lesson_id}/complete")
    def complete_lesson(lesson_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        lesson = course.lessons.get(lesson_id)
        if lesson is None:
            raise HTTPException(404, "No such lesson.")
        track = active_track(user, conn)
        require_unlocked(conn, track, lesson_id)
        states = exercise_states(conn, track["id"])
        unfinished = [
            course.exercises[e].title for e in lesson.exercises if states.get(e) is None or states[e]["passed_at"] is None
        ]
        if unfinished:
            raise HTTPException(409, "Pass every exercise first: " + ", ".join(unfinished))
        conn.execute(
            "INSERT OR IGNORE INTO completions (track_id, item_id, completed_at) VALUES (?, ?, ?)",
            (track["id"], f"lesson:{lesson_id}", db.now()),
        )
        conn.commit()
        return progress_payload(conn, track)

    @app.post("/api/checks/{check_id}/complete")
    def complete_check(check_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        if not CHECK_ID.match(check_id):
            raise HTTPException(400, "Bad check id.")
        track = active_track(user, conn)
        conn.execute(
            "INSERT OR IGNORE INTO completions (track_id, item_id, completed_at) VALUES (?, ?, ?)",
            (track["id"], f"check:{check_id}", db.now()),
        )
        conn.commit()
        return {"ok": True}

    # ------------------------------------------------------------------
    # Exercises
    # ------------------------------------------------------------------

    def exercise_state_payload(state: sqlite3.Row | None) -> dict[str, Any]:
        return {
            "passed": state is not None and state["passed_at"] is not None,
            "attempts": state["attempts"] if state else 0,
            "solution_available": solution_available(state),
        }

    @app.get("/api/exercises/{exercise_id}")
    def exercise(exercise_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        ex = get_exercise(exercise_id)
        track = active_track(user, conn)
        require_unlocked(conn, track, ex.lesson_id)
        lang = track["language"]
        state = conn.execute(
            "SELECT * FROM exercise_state WHERE track_id = ? AND exercise_id = ?", (track["id"], ex.id)
        ).fetchone()
        code = ex.starters[lang]
        if state is not None:
            code = state["draft"] or state["passed_code"] or code
        visible = [
            {
                "index": i,
                "description": t.get("description", ""),
                "args": [describe_arg(p["type"], a) for p, a in zip(ex.params, t["args"])],
                "expected": t.get("expected"),
                "expect_error": bool(t.get("expect_error")),
            }
            for i, t in ex.indexed_tests(include_hidden=False)
        ]
        return {
            "id": ex.id,
            "title": ex.title,
            "kind": ex.kind,
            "training": ex.training.get(lang),
            "lesson_id": ex.lesson_id,
            "language": lang,
            "function": ex.function,
            "params": ex.params,
            "returns": ex.returns,
            "starter": ex.starters[lang],
            "code": code,
            "tests": visible,
            "hidden_count": len(ex.tests) - len(visible),
            "hints": ex.hints,
            "library": [e.function for e in course.library_before(ex.id)],
            # Signatures for editor completions, hover docs and signature help.
            "library_functions": [
                {
                    "function": e.function,
                    "title": e.title,
                    "params": e.params,
                    "returns": e.returns,
                    "lesson_id": e.lesson_id,
                }
                for e in course.library_before(ex.id)
            ],
            **exercise_state_payload(state),
        }

    @app.put("/api/exercises/{exercise_id}/draft")
    def save_draft(
        exercise_id: str, body: CodeBody, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)
    ):
        ex = get_exercise(exercise_id)
        track = active_track(user, conn)
        _save_draft(conn, track["id"], ex.id, body.code)
        conn.commit()
        return {"ok": True}

    def _save_draft(conn: sqlite3.Connection, track_id: int, exercise_id: str, code: str) -> None:
        conn.execute(
            """INSERT INTO exercise_state (track_id, exercise_id, draft) VALUES (?, ?, ?)
               ON CONFLICT (track_id, exercise_id) DO UPDATE SET draft = excluded.draft""",
            (track_id, exercise_id, code),
        )

    def build_library(conn: sqlite3.Connection, track: sqlite3.Row, ex: Exercise):
        lang = track["language"]
        passed = {
            r["exercise_id"]: r["passed_code"]
            for r in conn.execute(
                "SELECT exercise_id, passed_code FROM exercise_state WHERE track_id = ? AND passed_code IS NOT NULL",
                (track["id"],),
            )
        }
        entries, used_reference = [], []
        for lib in course.library_before(ex.id):
            code = passed.get(lib.id)
            if code is None:
                code = lib.solutions[lang]
                used_reference.append(lib.function)
            entries.append(LibraryEntry(lib.id, code))
        return entries, used_reference

    async def execute(exercise_id: str, code: str, user: sqlite3.Row, conn: sqlite3.Connection, submit: bool):
        ex = get_exercise(exercise_id)
        if ex.kind != "function":
            raise HTTPException(400, "This exercise runs as a training job; start it from the training dashboard.")
        track = active_track(user, conn)
        require_unlocked(conn, track, ex.lesson_id)
        lock = run_locks.setdefault(user["id"], asyncio.Lock())
        if lock.locked():
            raise HTTPException(429, "Your previous run is still going.")
        async with lock:
            library, used_reference = build_library(conn, track, ex)
            try:
                report = await runner.run(
                    track["language"],
                    ex.spec(),
                    code,
                    ex.indexed_tests(include_hidden=submit),
                    library,
                    used_reference,
                )
            except SandboxError as exc:
                raise HTTPException(503, f"The code runner is unavailable: {exc}") from None

        _save_draft(conn, track["id"], ex.id, code)
        if submit:
            conn.execute(
                """INSERT INTO submissions (track_id, exercise_id, code, status, passed, total, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (track["id"], ex.id, code, report.status, report.passed, report.total, db.now()),
            )
            conn.execute(
                "UPDATE exercise_state SET attempts = attempts + 1 WHERE track_id = ? AND exercise_id = ?",
                (track["id"], ex.id),
            )
            if report.status == "passed":
                conn.execute(
                    """UPDATE exercise_state SET passed_code = ?, passed_at = COALESCE(passed_at, ?)
                       WHERE track_id = ? AND exercise_id = ?""",
                    (code, db.now(), track["id"], ex.id),
                )
        conn.commit()
        state = conn.execute(
            "SELECT * FROM exercise_state WHERE track_id = ? AND exercise_id = ?", (track["id"], ex.id)
        ).fetchone()
        return {"report": report.to_dict(), "submitted": submit, **exercise_state_payload(state)}

    @app.post("/api/exercises/{exercise_id}/run")
    async def run_code(
        exercise_id: str, body: CodeBody, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)
    ):
        return await execute(exercise_id, body.code, user, conn, submit=False)

    @app.post("/api/exercises/{exercise_id}/submit")
    async def submit_code(
        exercise_id: str, body: CodeBody, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)
    ):
        return await execute(exercise_id, body.code, user, conn, submit=True)

    @app.get("/api/exercises/{exercise_id}/submissions")
    def submissions(exercise_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        ex = get_exercise(exercise_id)
        track = active_track(user, conn)
        rows = conn.execute(
            """SELECT id, code, status, passed, total, created_at FROM submissions
               WHERE track_id = ? AND exercise_id = ? ORDER BY id DESC LIMIT 25""",
            (track["id"], ex.id),
        ).fetchall()
        return [dict(r) for r in rows]

    @app.get("/api/exercises/{exercise_id}/solution")
    def solution(exercise_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        ex = get_exercise(exercise_id)
        track = active_track(user, conn)
        state = conn.execute(
            "SELECT * FROM exercise_state WHERE track_id = ? AND exercise_id = ?", (track["id"], ex.id)
        ).fetchone()
        if not solution_available(state):
            raise HTTPException(
                403, f"The reference solution unlocks after {settings.solution_after_attempts} submissions."
            )
        return {"code": ex.solutions[track["language"]]}

    @app.get("/api/library")
    def library(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        track = active_track(user, conn)
        states = exercise_states(conn, track["id"])
        return {
            "language": track["language"],
            "functions": [
                {
                    "exercise_id": e,
                    "title": course.exercises[e].title,
                    "function": course.exercises[e].function,
                    "lesson_id": course.exercises[e].lesson_id,
                    "code": states[e]["passed_code"] if e in states else None,
                    "passed_at": states[e]["passed_at"] if e in states else None,
                }
                for e in course.exercise_order
                if course.exercises[e].library
            ],
        }

    # ------------------------------------------------------------------
    # Capstone training runs
    # ------------------------------------------------------------------

    def get_training_exercise(exercise_id: str) -> Exercise:
        ex = get_exercise(exercise_id)
        if ex.kind != "training":
            raise HTTPException(404, "That exercise isn't a training exercise.")
        return ex

    def get_run(conn: sqlite3.Connection, user: sqlite3.Row, run_id: int) -> sqlite3.Row:
        row = conn.execute(
            """SELECT training_runs.* FROM training_runs JOIN tracks ON tracks.id = training_runs.track_id
               WHERE training_runs.id = ? AND tracks.user_id = ?""",
            (run_id, user["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(404, "No such training run.")
        return row

    def run_summary(row: sqlite3.Row) -> dict[str, Any]:
        live = training.live.get(row["id"])
        return {
            "id": row["id"],
            "status": live.status if live else row["status"],
            "passed": bool(row["passed"]),
            "accuracy": row["accuracy"],
            "params": json.loads(row["params"]),
            "message": row["message"],
            "created_at": row["created_at"],
            "finished_at": row["finished_at"],
            "has_model": row["model"] is not None,
        }

    @app.get("/api/training/{exercise_id}")
    def training_overview(exercise_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        ex = get_training_exercise(exercise_id)
        track = active_track(user, conn)
        require_unlocked(conn, track, ex.lesson_id)
        rows = conn.execute(
            """SELECT id, status, passed, accuracy, params, message, created_at, finished_at, model IS NOT NULL AS model
               FROM training_runs WHERE track_id = ? AND exercise_id = ? ORDER BY id DESC""",
            (track["id"], ex.id),
        ).fetchall()
        active = training.active_for_user(user["id"])
        return {
            "language": track["language"],
            "config": ex.training[track["language"]],
            "available": mnist.available(),
            "runs": [run_summary(r) for r in rows],
            "active_run_id": active.run_id if active else None,
        }

    @app.post("/api/training/{exercise_id}/runs")
    async def start_training(
        exercise_id: str, body: TrainBody, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)
    ):
        ex = get_training_exercise(exercise_id)
        track = active_track(user, conn)
        require_unlocked(conn, track, ex.lesson_id)
        config = ex.training[track["language"]]
        if body.train_limit > config["max_train_limit"]:
            raise HTTPException(400, f"Train on at most {config['max_train_limit']:,} images.")
        if body.epochs > config["max_epochs"]:
            raise HTTPException(400, f"Use at most {config['max_epochs']} epochs.")
        if training.active_for_user(user["id"]) is not None:
            raise HTTPException(409, "You already have a training run going. Stop it or wait for it to finish.")
        _save_draft(conn, track["id"], ex.id, body.code)
        conn.commit()
        library, _ = build_library(conn, track, ex)
        params = body.model_dump(exclude={"code"})
        try:
            run_id = training.start(conn, user["id"], track, ex, body.code, params, library)
        except TrainingUnavailable as exc:
            raise HTTPException(503, str(exc)) from None
        return training.snapshot(get_run(conn, user, run_id))

    @app.get("/api/training/runs/{run_id}")
    def training_run(
        run_id: int, since: int = Query(0, ge=0), user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)
    ):
        return training.snapshot(get_run(conn, user, run_id), since)

    @app.post("/api/training/runs/{run_id}/cancel")
    def cancel_training(run_id: int, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        row = get_run(conn, user, run_id)
        if not training.cancel(row["id"]):
            raise HTTPException(409, "That run has already finished.")
        return {"ok": True}

    @app.get("/api/training/runs/{run_id}/model")
    def training_model(run_id: int, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        row = get_run(conn, user, run_id)
        if row["model"] is None:
            raise HTTPException(404, "This run didn't save a usable model.")
        return Response(row["model"], media_type="application/json")

    @app.get("/api/training/runs/{run_id}/predictions")
    def training_predictions(run_id: int, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_conn)):
        row = get_run(conn, user, run_id)
        if row["predictions"] is None:
            raise HTTPException(404, "This run has no predictions.")
        predicted = json.loads(row["predictions"])
        return {"predicted": predicted, "actual": mnist.labels()[: len(predicted)]}

    @app.get("/api/mnist/test-images")
    def mnist_test_images(ids: str = Query(max_length=1000), user=Depends(current_user)):
        """Raw 28×28 pixels (base64, one byte per pixel) and labels of some MNIST test images."""
        if not mnist.available():
            raise HTTPException(503, "MNIST isn't installed on this server.")
        try:
            wanted = [int(i) for i in ids.split(",") if i.strip()]
        except ValueError:
            raise HTTPException(400, "ids must be a comma-separated list of numbers.") from None
        if len(wanted) > 100 or any(not 0 <= i < 10000 for i in wanted):
            raise HTTPException(400, "Ask for at most 100 images with ids from 0 to 9999.")
        labels = mnist.labels()
        return {
            "images": {str(i): base64.b64encode(mnist.image(i)).decode("ascii") for i in wanted},
            "labels": {str(i): labels[i] for i in wanted},
        }

    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    def api_not_found(path: str):
        raise HTTPException(404, "Not found.")

    # ------------------------------------------------------------------
    # Frontend (production build)
    # ------------------------------------------------------------------

    static_dir = settings.static_dir.resolve()
    if (static_dir / "index.html").exists():
        if (static_dir / "assets").is_dir():
            app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        def spa(path: str):
            candidate = (static_dir / path).resolve()
            if path and candidate.is_file() and static_dir in candidate.parents:
                return FileResponse(candidate)
            # index.html names the current build's hashed files, so it must never
            # be served from cache after a redeploy. (The hashed assets can be.)
            return FileResponse(static_dir / "index.html", headers={"Cache-Control": "no-cache"})

    return app
