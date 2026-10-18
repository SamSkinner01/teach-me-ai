import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import ROOT, Settings
from app.main import create_app
from app.runner import LocalSandbox

HAS_TOOLCHAINS = all(shutil.which(t) for t in ("python3", "rustc", "g++"))


def make_settings(tmp_path: Path, **overrides) -> Settings:
    base = dict(
        db_path=tmp_path / "test.db",
        content_dir=ROOT / "content",
        static_dir=tmp_path / "no-static",
        sandbox="local",
        runner_image="unused",
        sandbox_memory="512m",
        max_concurrent_runs=2,
        unlock_all=False,
        secure_cookies=False,
        session_days=1,
        solution_after_attempts=3,
        allow_registration=True,
    )
    base.update(overrides)
    return Settings(**base)


@pytest.fixture
def settings(tmp_path):
    return make_settings(tmp_path)


@pytest.fixture
def client(settings):
    app = create_app(settings, sandbox=LocalSandbox())
    with TestClient(app) as c:
        yield c


def register(client, username="ada", password="correct horse"):
    r = client.post("/api/auth/register", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture
def python_learner(client):
    register(client)
    r = client.post("/api/tracks", json={"language": "python"})
    assert r.status_code == 200, r.text
    return client
