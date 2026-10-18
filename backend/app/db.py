"""SQLite storage. One connection per request; WAL mode for concurrent readers."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

SCHEMA_VERSION = 2

SCHEMA = """
CREATE TABLE users (
    id              INTEGER PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash   TEXT NOT NULL,
    active_track_id INTEGER,
    created_at      TEXT NOT NULL
);

CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- One track per (user, language). The language is fixed for the whole track.
CREATE TABLE tracks (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language   TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, language)
);

CREATE TABLE exercise_state (
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    draft       TEXT,
    passed_code TEXT,      -- last submission that passed every test; used as library code
    passed_at   TEXT,
    attempts    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (track_id, exercise_id)
);

CREATE TABLE submissions (
    id          INTEGER PRIMARY KEY,
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    code        TEXT NOT NULL,
    status      TEXT NOT NULL,
    passed      INTEGER NOT NULL,
    total       INTEGER NOT NULL,
    created_at  TEXT NOT NULL
);
CREATE INDEX submissions_by_exercise ON submissions (track_id, exercise_id, id);

-- Completed lessons ("lesson:<id>") and answered checks ("check:<id>").
CREATE TABLE completions (
    track_id     INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    item_id      TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (track_id, item_id)
);
"""


# Applied in order to bring an older database up to SCHEMA_VERSION.
MIGRATIONS = {
    2: """
-- Capstone training runs. Live progress is kept in memory while a run is
-- going; this row gets the final (downsampled) curve, predictions and weights.
CREATE TABLE training_runs (
    id          INTEGER PRIMARY KEY,
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    code        TEXT NOT NULL,
    params      TEXT NOT NULL,          -- JSON hyperparameters
    status      TEXT NOT NULL,          -- queued | running | succeeded | failed | cancelled
    passed      INTEGER NOT NULL DEFAULT 0,
    accuracy    REAL,
    message     TEXT NOT NULL DEFAULT '',
    result      TEXT,                   -- JSON: compiler output, stdout/stderr, error detail
    progress    TEXT,                   -- JSON list of [epoch, step, total_steps, loss, accuracy, batches, seconds]
    predictions TEXT,                   -- JSON list, one label per test image
    model       TEXT,                   -- JSON "tmai-cnn-v1" model for the browser
    created_at  TEXT NOT NULL,
    started_at  TEXT,
    finished_at TEXT
);
CREATE INDEX training_runs_by_exercise ON training_runs (track_id, exercise_id, id);
""",
}


def now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def connect(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 5000")
    return conn


def init(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = connect(path)
    try:
        conn.execute("PRAGMA journal_mode = WAL")
        version = conn.execute("PRAGMA user_version").fetchone()[0]
        if version > SCHEMA_VERSION:
            raise RuntimeError(f"database schema {version} is newer than this app ({SCHEMA_VERSION})")
        if version == 0:
            conn.executescript(SCHEMA)
            version = 1
        for target in range(version + 1, SCHEMA_VERSION + 1):
            conn.executescript(MIGRATIONS[target])
        if version != SCHEMA_VERSION:
            conn.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
        conn.commit()
    finally:
        conn.close()
