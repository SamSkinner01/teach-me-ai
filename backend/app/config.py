"""Settings, read from TMAI_* environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


@dataclass
class Settings:
    db_path: Path
    content_dir: Path
    static_dir: Path
    # "docker" (isolated, default) or "local" (development only: runs code on the host)
    sandbox: str
    runner_image: str
    sandbox_memory: str
    max_concurrent_runs: int
    # Capstone training runs: memory per run, and how many may run at once (the rest queue).
    training_memory: str
    max_concurrent_trainings: int
    # Uncompressed MNIST IDX files (scripts/fetch_mnist.py). The backend reads the
    # test labels and images from here; the local sandbox reads everything.
    mnist_dir: Path
    # Let every lesson be opened without finishing the previous one (for content authors).
    unlock_all: bool
    # Set when serving over HTTPS so the session cookie is never sent in clear text.
    secure_cookies: bool
    session_days: int
    solution_after_attempts: int
    allow_registration: bool

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            db_path=Path(os.environ.get("TMAI_DB_PATH", ROOT / "backend" / "data" / "teach-me-ai.db")),
            content_dir=Path(os.environ.get("TMAI_CONTENT_DIR", ROOT / "content")),
            static_dir=Path(os.environ.get("TMAI_STATIC_DIR", ROOT / "frontend" / "dist")),
            sandbox=os.environ.get("TMAI_SANDBOX", "docker"),
            runner_image=os.environ.get("TMAI_RUNNER_IMAGE", "teach-me-ai-runner:latest"),
            sandbox_memory=os.environ.get("TMAI_SANDBOX_MEMORY", "768m"),
            max_concurrent_runs=int(os.environ.get("TMAI_MAX_CONCURRENT_RUNS", "4")),
            training_memory=os.environ.get("TMAI_TRAINING_MEMORY", "2g"),
            max_concurrent_trainings=int(os.environ.get("TMAI_MAX_CONCURRENT_TRAININGS", "1")),
            mnist_dir=Path(os.environ.get("TMAI_MNIST_DIR", ROOT / "data" / "mnist" / "raw")),
            unlock_all=_bool("TMAI_UNLOCK_ALL", False),
            secure_cookies=_bool("TMAI_SECURE_COOKIES", False),
            session_days=int(os.environ.get("TMAI_SESSION_DAYS", "30")),
            solution_after_attempts=int(os.environ.get("TMAI_SOLUTION_AFTER_ATTEMPTS", "3")),
            allow_registration=_bool("TMAI_ALLOW_REGISTRATION", True),
        )
