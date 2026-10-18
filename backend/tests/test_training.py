"""Capstone training runs through the API, on the real MNIST files."""

import json
import time

import pytest
from fastapi.testclient import TestClient

from app.config import ROOT
from app.main import create_app
from app.runner import LocalSandbox

from .conftest import HAS_TOOLCHAINS, make_settings, register

MNIST = ROOT / "data" / "mnist" / "raw"
pytestmark = [
    pytest.mark.skipif(not HAS_TOOLCHAINS, reason="needs python3, rustc and g++"),
    pytest.mark.skipif(not (MNIST / "t10k-labels-idx1-ubyte").exists(), reason="run scripts/fetch_mnist.py"),
]

SOLUTION = (ROOT / "content" / "exercises" / "cap-train" / "solution.py").read_text()
STARTER = (ROOT / "content" / "exercises" / "cap-train" / "starter.py").read_text()
SMALL = {"train_limit": 100, "epochs": 1, "lr": 0.05, "batch_size": 10, "seed": 42}
FOREVER = (
    "def train_cnn(data_dir, train_limit, test_limit, epochs, lr, batch_size, seed):\n"
    "    step = 0\n"
    "    while True:\n"
    "        step += 1\n"
    "        report_progress(0, step, 10**9, 1.0, 0.0)\n"
)


@pytest.fixture
def app(tmp_path):
    return create_app(make_settings(tmp_path, unlock_all=True), sandbox=LocalSandbox(MNIST))


@pytest.fixture
def learner(app):
    with TestClient(app) as c:
        register(c)
        assert c.post("/api/tracks", json={"language": "python"}).status_code == 200
        yield c


def start(client, code, **params):
    r = client.post("/api/training/cap-train/runs", json={"code": code, **SMALL, **params})
    assert r.status_code == 200, r.text
    return r.json()


def wait(client, run_id, timeout=120):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        run = client.get(f"/api/training/runs/{run_id}").json()
        if run["status"] in ("succeeded", "failed", "cancelled"):
            return run
        time.sleep(0.2)
    raise AssertionError("run did not finish")


def test_reference_run_reports_progress_predictions_and_a_model(app, learner):
    app.state.course.exercises["cap-train"].training["python"]["threshold"] = 0.3
    run = start(learner, SOLUTION)
    assert run["status"] in ("queued", "running")
    done = wait(learner, run["id"])
    assert done["status"] == "succeeded", done
    assert done["passed"] is True
    assert 0.3 <= done["accuracy"] < 1
    assert len(done["points"]) >= 2
    epoch, step, total, loss, acc, batches, seconds = done["points"][-1]
    assert (step, total) == (10, 10) and loss > 0 and 0 <= acc <= 1
    assert sum(p[5] for p in done["points"]) == 10, "every batch is counted once"
    assert done["has_model"] and done["has_predictions"]

    preds = learner.get(f"/api/training/runs/{run['id']}/predictions").json()
    assert len(preds["predicted"]) == len(preds["actual"]) == 1000
    right = sum(p == a for p, a in zip(preds["predicted"], preds["actual"]))
    assert right / 1000 == pytest.approx(done["accuracy"])

    model = learner.get(f"/api/training/runs/{run['id']}/model").json()
    assert model["format"] == "tmai-cnn-v1"
    assert [layer["type"] for layer in model["layers"]] == ["conv", "relu", "maxpool", "flatten", "dense"]
    assert model["layers"][4]["w"]["shape"] == [10, 1352]

    progress = learner.get("/api/progress").json()
    assert progress["exercises"]["cap-train"] == {"passed": True, "attempts": 1}
    overview = learner.get("/api/training/cap-train").json()
    assert overview["active_run_id"] is None
    assert overview["runs"][0]["id"] == run["id"] and overview["runs"][0]["has_model"]


def test_below_the_threshold_does_not_pass(learner):
    done = wait(learner, start(learner, SOLUTION)["id"])
    assert done["status"] == "succeeded" and done["passed"] is False
    assert "need 85%" in done["message"]
    assert learner.get("/api/progress").json()["exercises"]["cap-train"]["passed"] is False


def test_starter_fails_with_not_implemented(learner):
    done = wait(learner, start(learner, STARTER)["id"])
    assert done["status"] == "failed"
    assert "Not implemented" in done["message"]


def test_missing_predictions_fail(learner):
    code = "def train_cnn(data_dir, train_limit, test_limit, epochs, lr, batch_size, seed):\n    return 0.99\n"
    done = wait(learner, start(learner, code)["id"])
    assert done["status"] == "failed" and "report_predictions" in done["message"]


def test_one_run_at_a_time_and_cancel(learner):
    run = start(learner, FOREVER)
    r = learner.post("/api/training/cap-train/runs", json={"code": FOREVER, **SMALL})
    assert r.status_code == 409
    deadline = time.monotonic() + 30
    while not learner.get(f"/api/training/runs/{run['id']}").json()["points"]:
        assert time.monotonic() < deadline
        time.sleep(0.1)
    live = learner.get(f"/api/training/runs/{run['id']}").json()
    assert live["status"] == "running" and live["elapsed"] > 0
    later = learner.get(f"/api/training/runs/{run['id']}", params={"since": len(live["points"])}).json()
    assert later["points_from"] == len(live["points"])

    assert learner.post(f"/api/training/runs/{run['id']}/cancel", json={}).status_code == 200
    done = wait(learner, run["id"], timeout=15)
    assert done["status"] == "cancelled"
    assert learner.post(f"/api/training/runs/{run['id']}/cancel", json={}).status_code == 409
    # Cancelled runs don't count as attempts.
    assert learner.get("/api/progress").json()["exercises"]["cap-train"]["attempts"] == 0


def test_validation_and_access(app, learner):
    r = learner.post("/api/training/cap-train/runs", json={"code": SOLUTION, **SMALL, "train_limit": 60000})
    assert r.status_code == 400 and "at most" in r.json()["detail"]
    r = learner.post("/api/training/cap-train/runs", json={"code": SOLUTION, **SMALL, "lr": 0})
    assert r.status_code == 422
    assert learner.post("/api/exercises/cap-train/submit", json={"code": SOLUTION}).status_code == 400
    assert learner.get("/api/training/la-dot").status_code == 404

    run = start(learner, STARTER)
    wait(learner, run["id"])
    learner.post("/api/auth/logout", json={})
    register(learner, "grace")
    learner.post("/api/tracks", json={"language": "python"})
    assert learner.get(f"/api/training/runs/{run['id']}").status_code == 404
    assert learner.get(f"/api/training/runs/{run['id']}/model").status_code == 404


def test_mnist_test_images(learner):
    r = learner.get("/api/mnist/test-images", params={"ids": "0,7"})
    assert r.status_code == 200
    import base64
    first = base64.b64decode(r.json()["images"]["0"])
    assert len(first) == 784 and max(first) == 255
    assert r.json()["labels"] == {"0": 7, "7": 9}
    assert learner.get("/api/mnist/test-images", params={"ids": "10000"}).status_code == 400
    assert learner.get("/api/mnist/test-images", params={"ids": "x"}).status_code == 400


def test_interrupted_runs_are_marked_failed(tmp_path):
    settings = make_settings(tmp_path)
    create_app(settings, sandbox=LocalSandbox(MNIST))
    from app import db
    conn = db.connect(settings.db_path)
    conn.execute("INSERT INTO users (username, password_hash, created_at) VALUES ('x', 'x', 'now')")
    conn.execute("INSERT INTO tracks (user_id, language, created_at) VALUES (1, 'python', 'now')")
    conn.execute("""INSERT INTO training_runs (track_id, exercise_id, code, params, status, created_at)
                    VALUES (1, 'cap-train', '', '{}', 'running', 'now')""")
    conn.commit()
    create_app(settings, sandbox=LocalSandbox(MNIST))
    row = conn.execute("SELECT status, message FROM training_runs").fetchone()
    assert row["status"] == "failed" and "restarted" in row["message"]


def test_shutdown_marks_running_runs_as_interrupted(app):
    with TestClient(app) as c:
        register(c)
        c.post("/api/tracks", json={"language": "python"})
        run = start(c, FOREVER)
        deadline = time.monotonic() + 30
        while c.get(f"/api/training/runs/{run['id']}").json()["status"] != "running":
            assert time.monotonic() < deadline
            time.sleep(0.1)
    # Leaving the block shuts the app down.
    with TestClient(app) as c:
        c.post("/api/auth/login", json={"username": "ada", "password": "correct horse"})
        done = c.get(f"/api/training/runs/{run['id']}").json()
        assert done["status"] == "failed" and "restarted" in done["message"]


def test_oversized_reports_are_ignored():
    from app.training import Live

    live = Live(run_id=1, user_id=1, epochs=1)
    live.on_line(json.dumps({"kind": "predictions", "values": [1] * 10_001}))
    assert live.predictions is None
    live.on_line(json.dumps({"kind": "tensor", "name": "w", "shape": [2, 2], "data": [1, 2, 3]}))
    assert "w" not in live.tensors and live.notes
    live.on_line("not json")
    live.on_line(json.dumps(["not", "a", "dict"]))
    live.on_line(json.dumps({"kind": "progress", "epoch": 0, "step": 1, "total_steps": 2, "loss": "NaN", "accuracy": 0.5}))
    assert live.points[0][3] is None and live.points[0][4] == 0.5
