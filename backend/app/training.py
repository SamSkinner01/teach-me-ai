"""Capstone training runs: long sandbox jobs that stream their progress.

A run is one call to the learner's ``train_cnn(...)`` on the real MNIST files.
While it runs, everything it reports through the SDK (progress, predictions,
weights) arrives line by line and is kept in memory here, so polling is cheap.
When it finishes, the outcome is written to ``training_runs``: the learning
curve (downsampled), the test-set predictions and the trained weights as a
"tmai-cnn-v1" model the browser can run.

Accuracy is computed here from the reported predictions and the real test
labels, not taken from the value the function returns.
"""

from __future__ import annotations

import asyncio
import base64
import json
import math
import sqlite3
import struct
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from . import db
from .course import Exercise
from .runner import LibraryEntry, Sandbox, SandboxError
from .runner.codegen import build_job
from .runner.grading import grade_training

TERMINAL = ("succeeded", "failed", "cancelled")
MAX_LIVE_POINTS = 20_000
STORED_POINTS = 1_000
MAX_TENSOR_VALUES = 1_000_000
MAX_PREDICTIONS = 10_000  # the MNIST test set
MAX_RESULT_LINES = 20
KEEP_RUNS = 10
INPUT = {"size": 28, "mean": 0.1307, "std": 0.3081}


class TrainingUnavailable(Exception):
    """MNIST isn't on this server, or the queue is full."""


@dataclass
class Live:
    run_id: int
    user_id: int
    epochs: int
    status: str = "queued"
    points: list[list[float]] = field(default_factory=list)
    tensors: dict[str, tuple[list[int], list[float]]] = field(default_factory=dict)
    tensor_values: int = 0
    predictions: list[int] | None = None
    result_lines: list[dict[str, Any]] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    started: float | None = None
    task: asyncio.Task | None = None

    def on_line(self, raw: str) -> None:
        try:
            msg = json.loads(raw)
        except ValueError:
            return
        if not isinstance(msg, dict):
            return
        kind = msg.get("kind")
        if kind == "progress":
            self._progress(msg)
        elif kind == "tensor":
            self._tensor(msg)
        elif kind == "predictions":
            values = msg.get("values")
            if (
                isinstance(values, list)
                and len(values) <= MAX_PREDICTIONS
                and all(isinstance(v, int) and not isinstance(v, bool) for v in values)
            ):
                self.predictions = values
        elif kind in ("case", "load_error") and len(self.result_lines) < MAX_RESULT_LINES:
            self.result_lines.append(msg)

    def _progress(self, msg: dict[str, Any]) -> None:
        if len(self.points) >= MAX_LIVE_POINTS:
            return
        try:
            point = [
                int(msg["epoch"]),
                int(msg["step"]),
                int(msg["total_steps"]),
                _number(msg.get("loss")),
                _number(msg.get("accuracy")),
                int(msg.get("batches", 1)),
                round(time.monotonic() - (self.started or time.monotonic()), 2),
            ]
        except (KeyError, TypeError, ValueError):
            return
        self.points.append(point)

    def _tensor(self, msg: dict[str, Any]) -> None:
        name, shape, data = msg.get("name"), msg.get("shape"), msg.get("data")
        if not (isinstance(name, str) and 0 < len(name) <= 64 and isinstance(shape, list) and isinstance(data, list)):
            return
        if not all(isinstance(s, int) and 0 <= s for s in shape) or math.prod(shape) != len(data):
            self.notes.append(f"save_tensor({name!r}): the shape {shape} doesn't match {len(data)} values, so it was ignored.")
            return
        if self.tensor_values + len(data) > MAX_TENSOR_VALUES:
            self.notes.append(f"save_tensor({name!r}): too many values in total, so it was ignored.")
            return
        try:
            values = [float(x) for x in data]
        except (TypeError, ValueError):
            return
        self.tensor_values += len(data)
        self.tensors[name] = (shape, values)


def _number(x: Any) -> float | None:
    if isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x):
        return float(x)
    return None  # NaN, infinity or garbage: drawn as a gap


def downsample(points: list[list[Any]], limit: int = STORED_POINTS) -> list[list[Any]]:
    """Merge neighbouring points (weighted by how many batches each covers) down to ``limit``."""
    if len(points) <= limit:
        return points
    out = []
    for g in range(limit):
        group = points[g * len(points) // limit:(g + 1) * len(points) // limit]
        last = group[-1]
        merged = list(last)
        for col in (3, 4):
            weighted = [(p[col], p[5]) for p in group if p[col] is not None]
            weight = sum(w for _, w in weighted)
            merged[col] = sum(v * w for v, w in weighted) / weight if weight else None
        merged[5] = sum(p[5] for p in group)
        out.append(merged)
    return out


def _encode(values: list[float]) -> str:
    return base64.b64encode(struct.pack(f"<{len(values)}f", *values)).decode("ascii")


def build_model(tensors: dict[str, tuple[list[int], list[float]]], accuracy: float) -> tuple[dict | None, str]:
    """The capstone architecture as a browser model, or None and the reason it doesn't fit."""
    need = ["conv1.w", "conv1.b", "dense.w", "dense.b"]
    missing = [n for n in need if n not in tensors]
    if missing:
        return None, "Save your weights with save_tensor (missing: " + ", ".join(missing) + ") to use your model in the browser."
    (cw_shape, cw), (cb_shape, cb), (dw_shape, dw), (db_shape, dbias) = (tensors[n] for n in need)
    ok = (
        len(cw_shape) == 4 and cw_shape[1] == 1 and cw_shape[2] == cw_shape[3] and 1 <= cw_shape[2] <= 9
        and cb_shape == [cw_shape[0]] and len(dw_shape) == 2 and dw_shape[0] == 10 and db_shape == [10]
    )
    if ok:
        side = (INPUT["size"] - cw_shape[2] + 1) // 2
        ok = dw_shape[1] == cw_shape[0] * side * side
    if not ok:
        return None, (
            "The saved weights don't have the capstone shapes (conv1.w [F, 1, K, K], conv1.b [F], "
            "dense.w [10, F·13·13], dense.b [10]), so the browser can't run them."
        )
    model = {
        "format": "tmai-cnn-v1",
        "trained": db.now()[:10],
        "test_accuracy": accuracy,
        "input": INPUT,
        "layers": [
            {"type": "conv", "w": {"shape": cw_shape, "data": _encode(cw)}, "b": {"shape": cb_shape, "data": _encode(cb)}},
            {"type": "relu"},
            {"type": "maxpool"},
            {"type": "flatten"},
            {"type": "dense", "w": {"shape": dw_shape, "data": _encode(dw)}, "b": {"shape": db_shape, "data": _encode(dbias)}},
        ],
    }
    return model, ""


class Mnist:
    """The MNIST test set, as the backend needs it (labels for grading, images for the gallery)."""

    def __init__(self, directory: Path) -> None:
        self.directory = directory
        self._labels: list[int] | None = None
        self._images: bytes | None = None

    def available(self) -> bool:
        return all((self.directory / n).is_file() for n in ("t10k-labels-idx1-ubyte", "t10k-images-idx3-ubyte"))

    def labels(self) -> list[int]:
        if self._labels is None:
            raw = (self.directory / "t10k-labels-idx1-ubyte").read_bytes()
            self._labels = list(raw[8:])
        return self._labels

    def image(self, index: int) -> bytes:
        if self._images is None:
            self._images = (self.directory / "t10k-images-idx3-ubyte").read_bytes()
        start = 16 + index * 784
        return self._images[start:start + 784]


class TrainingManager:
    def __init__(self, sandbox: Sandbox, db_path: Path, mnist: Mnist, memory: str,
                 max_concurrent: int = 1, max_queued: int = 8) -> None:
        self.sandbox = sandbox
        self.db_path = db_path
        self.mnist = mnist
        self.memory = memory
        self.max_queued = max_queued
        self._slots = asyncio.Semaphore(max_concurrent)
        self.live: dict[int, Live] = {}
        self._queue: list[int] = []
        self._loop: asyncio.AbstractEventLoop | None = None
        self._shutting_down = False

    # ------------------------------------------------------------------

    def recover(self, conn: sqlite3.Connection) -> None:
        """Runs that were going when the server stopped can't be resumed."""
        conn.execute(
            """UPDATE training_runs SET status = 'failed', message = 'The server restarted during this run. Start it again.',
                   finished_at = ? WHERE status IN ('queued', 'running')""",
            (db.now(),),
        )
        conn.commit()

    def active_for_user(self, user_id: int) -> Live | None:
        return next((r for r in self.live.values() if r.user_id == user_id), None)

    def start(  # must be called from the event loop (an async endpoint)
        self,
        conn: sqlite3.Connection,
        user_id: int,
        track: sqlite3.Row,
        ex: Exercise,
        code: str,
        params: dict[str, Any],
        library: list[LibraryEntry],
    ) -> int:
        if not self.mnist.available():
            raise TrainingUnavailable("MNIST isn't installed on this server (run scripts/fetch_mnist.py).")
        if len(self._queue) >= self.max_queued:
            raise TrainingUnavailable("The training queue is full. Try again in a few minutes.")
        lang = track["language"]
        config = ex.training[lang]
        run_id = conn.execute(
            """INSERT INTO training_runs (track_id, exercise_id, code, params, status, created_at)
               VALUES (?, ?, ?, ?, 'queued', ?)""",
            (track["id"], ex.id, code, json.dumps(params), db.now()),
        ).lastrowid
        conn.commit()

        spec = {**ex.spec(), "time_limit": config["time_limit"]}
        args = [
            self.sandbox.data_dir, params["train_limit"], config["test_limit"], params["epochs"],
            params["lr"], params["batch_size"], params["seed"],
        ]
        job = build_job(lang, spec, [(0, args)], code, library, sdk=True)
        job.extra["memory"] = self.memory
        live = Live(run_id=run_id, user_id=user_id, epochs=params["epochs"])
        self.live[run_id] = live
        self._queue.append(run_id)
        self._loop = asyncio.get_running_loop()
        live.task = self._loop.create_task(self._run(live, job, spec, track, ex, config))
        return run_id

    def cancel(self, run_id: int) -> bool:
        """Stop a run. Safe to call from any thread (sync endpoints run in a threadpool)."""
        live = self.live.get(run_id)
        if live is None or live.task is None or self._loop is None:
            return False
        self._loop.call_soon_threadsafe(live.task.cancel)
        return True

    async def shutdown(self) -> None:
        self._shutting_down = True
        tasks = [r.task for r in self.live.values() if r.task]
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    # ------------------------------------------------------------------

    async def _run(self, live: Live, job, spec, track, ex: Exercise, config) -> None:
        try:
            async with self._slots:
                self._queue.remove(live.run_id)
                live.status = "running"
                live.started = time.monotonic()
                self._update(live.run_id, status="running", started_at=db.now())
                try:
                    result = await self.sandbox.execute_stream(job, live.on_line)
                except SandboxError as exc:
                    # Not the learner's fault, so it doesn't count as an attempt.
                    self._finish(live, track, ex, config, status="failed", message=f"The code runner failed: {exc}",
                                 count=False)
                    return
                self._grade(live, spec, result, track, ex, config)
        except asyncio.CancelledError:
            if live.run_id in self._queue:
                self._queue.remove(live.run_id)
            if self._shutting_down:
                self._finish(live, track, ex, config, status="failed", count=False,
                             message="The server restarted during this run. Start it again.")
            else:
                self._finish(live, track, ex, config, status="cancelled", message="You stopped this run.", count=False)
            raise
        except Exception as exc:  # never leave a run stuck in "running"
            self._finish(live, track, ex, config, status="failed", message=f"Something went wrong on the server: {exc}")
        finally:
            self.live.pop(live.run_id, None)

    def _grade(self, live: Live, spec, result, track, ex: Exercise, config) -> None:
        outcome = grade_training(spec, result, live.result_lines)
        details = {
            "outcome": outcome.status,
            "compile_output": outcome.compile_output,
            "detail": outcome.detail,
            "stdout": outcome.stdout,
            "stderr": outcome.stderr,
            "time_ms": outcome.time_ms,
            "returned": outcome.value,
            "notes": list(live.notes),
        }
        if outcome.status != "ok":
            self._finish(live, track, ex, config, status="failed", message=outcome.message, details=details)
            return

        labels = self.mnist.labels()[: config["test_limit"]]
        preds = live.predictions
        if preds is None or len(preds) != len(labels):
            got = "nothing" if preds is None else f"{len(preds)} labels"
            msg = (f"Training finished, but report_predictions got {got}; it needs one predicted label for each of "
                   f"the {len(labels)} test images, in order.")
            self._finish(live, track, ex, config, status="failed", message=msg, details=details)
            return

        accuracy = sum(1 for p, y in zip(preds, labels) if p == y) / len(labels)
        returned = outcome.value
        if isinstance(returned, (int, float)) and abs(returned - accuracy) > 1e-6:
            details["notes"].append(
                f"Your function returned {returned:.4f}, but the predictions you reported score {accuracy:.4f}. "
                "The reported predictions are what counts."
            )
        model, why_not = build_model(live.tensors, accuracy)
        if why_not:
            details["notes"].append(why_not)
        threshold = config["threshold"]
        passed = accuracy >= threshold
        message = (
            f"{accuracy:.1%} on {len(labels):,} test images: above the {threshold:.0%} needed to pass. Your CNN works!"
            if passed
            else f"{accuracy:.1%} on {len(labels):,} test images. You need {threshold:.0%} to pass."
        )
        self._finish(live, track, ex, config, status="succeeded", message=message, details=details,
                     accuracy=accuracy, passed=passed, predictions=preds, model=model)

    def _finish(self, live: Live, track, ex: Exercise, config, *, status: str, message: str,
                details: dict | None = None, accuracy: float | None = None, passed: bool = False,
                predictions: list[int] | None = None, model: dict | None = None, count: bool = True) -> None:
        live.status = status
        conn = db.connect(self.db_path)
        try:
            run = conn.execute("SELECT code FROM training_runs WHERE id = ?", (live.run_id,)).fetchone()
            if run is None:  # the account was deleted meanwhile
                return
            conn.execute(
                """UPDATE training_runs SET status = ?, message = ?, result = ?, accuracy = ?, passed = ?,
                       progress = ?, predictions = ?, model = ?, finished_at = ? WHERE id = ?""",
                (
                    status, message, json.dumps(details or {}), accuracy, int(passed),
                    json.dumps(downsample(live.points)),
                    json.dumps(predictions) if predictions is not None else None,
                    json.dumps(model) if model is not None else None,
                    db.now(), live.run_id,
                ),
            )
            if count:
                self._record_attempt(conn, track, ex, run["code"], status, passed)
            self._prune(conn, track["id"], ex.id)
            conn.commit()
        finally:
            conn.close()

    def _record_attempt(self, conn, track, ex: Exercise, code: str, status: str, passed: bool) -> None:
        conn.execute(
            """INSERT INTO exercise_state (track_id, exercise_id, attempts) VALUES (?, ?, 1)
               ON CONFLICT (track_id, exercise_id) DO UPDATE SET attempts = attempts + 1""",
            (track["id"], ex.id),
        )
        if passed:
            conn.execute(
                """UPDATE exercise_state SET passed_code = ?, passed_at = COALESCE(passed_at, ?)
                   WHERE track_id = ? AND exercise_id = ?""",
                (code, db.now(), track["id"], ex.id),
            )
        conn.execute(
            """INSERT INTO submissions (track_id, exercise_id, code, status, passed, total, created_at)
               VALUES (?, ?, ?, ?, ?, 1, ?)""",
            (track["id"], ex.id, code, "passed" if passed else "failed", int(passed), db.now()),
        )

    def _prune(self, conn: sqlite3.Connection, track_id: int, exercise_id: str) -> None:
        """Keep the latest runs, plus the best one (its model is the learner's model)."""
        conn.execute(
            """DELETE FROM training_runs WHERE track_id = ? AND exercise_id = ? AND status IN ('succeeded', 'failed', 'cancelled')
               AND id NOT IN (SELECT id FROM training_runs WHERE track_id = ? AND exercise_id = ? ORDER BY id DESC LIMIT ?)
               AND id IS NOT (SELECT id FROM training_runs WHERE track_id = ? AND exercise_id = ? AND model IS NOT NULL
                              ORDER BY accuracy DESC, id DESC LIMIT 1)""",
            (track_id, exercise_id, track_id, exercise_id, KEEP_RUNS, track_id, exercise_id),
        )

    def _update(self, run_id: int, **fields: Any) -> None:
        conn = db.connect(self.db_path)
        try:
            sets = ", ".join(f"{k} = ?" for k in fields)
            conn.execute(f"UPDATE training_runs SET {sets} WHERE id = ?", (*fields.values(), run_id))
            conn.commit()
        finally:
            conn.close()

    # ------------------------------------------------------------------

    def snapshot(self, row: sqlite3.Row, since: int = 0) -> dict[str, Any]:
        """What the dashboard shows for one run. While it's going, ``since`` skips
        points the client already has; once it's over, the whole stored curve is sent."""
        live = self.live.get(row["id"])
        base = {
            "id": row["id"],
            "params": json.loads(row["params"]),
            "created_at": row["created_at"],
            "started_at": row["started_at"],
            "finished_at": row["finished_at"],
        }
        if live is not None:
            since = max(0, min(since, len(live.points)))
            return {
                **base,
                "status": live.status,
                "queue_position": self._queue.index(row["id"]) + 1 if row["id"] in self._queue else None,
                "elapsed": round(time.monotonic() - live.started, 1) if live.started else 0,
                "points_from": since,
                "points": live.points[since:],
                "passed": False,
                "accuracy": None,
                "message": "",
                "result": None,
                "has_model": False,
                "has_predictions": False,
            }
        return {
            **base,
            "status": row["status"],
            "queue_position": None,
            "elapsed": None,
            "points_from": 0,
            "points": json.loads(row["progress"]) if row["progress"] else [],
            "passed": bool(row["passed"]),
            "accuracy": row["accuracy"],
            "message": row["message"],
            "result": json.loads(row["result"]) if row["result"] else None,
            "has_model": row["model"] is not None,
            "has_predictions": row["predictions"] is not None,
        }
