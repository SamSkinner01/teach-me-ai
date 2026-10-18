"""Accounts and sessions: scrypt password hashes and opaque session tokens."""

from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
import sqlite3
import time
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta

from . import db

SESSION_COOKIE = "tmai_session"
USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,32}$")
MIN_PASSWORD = 8
MAX_PASSWORD = 256

# scrypt parameters: N=2^15, r=8, p=1 (~32 MiB, tens of ms per hash).
_N, _R, _P = 2**15, 8, 1
_MAXMEM = 64 * 1024 * 1024


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P, maxmem=_MAXMEM, dklen=32)
    return f"scrypt${_N}${_R}${_P}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt, digest = stored.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    expected = base64.b64decode(digest)
    actual = hashlib.scrypt(
        password.encode("utf-8"),
        salt=base64.b64decode(salt),
        n=int(n), r=int(r), p=int(p),
        maxmem=_MAXMEM,
        dklen=len(expected),
    )
    return hmac.compare_digest(actual, expected)


def validate_credentials(username: str, password: str) -> str | None:
    """Return an error message, or None if the credentials are acceptable."""
    if not USERNAME_RE.match(username):
        return "Usernames are 3–32 characters: letters, digits, '.', '_' or '-'."
    if len(password) < MIN_PASSWORD:
        return f"Passwords need at least {MIN_PASSWORD} characters."
    if len(password) > MAX_PASSWORD:
        return f"Passwords can be at most {MAX_PASSWORD} characters."
    return None


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("ascii")).hexdigest()


def create_session(conn: sqlite3.Connection, user_id: int, days: int) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(UTC) + timedelta(days=days)
    conn.execute(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (_token_hash(token), user_id, db.now(), expires.isoformat(timespec="seconds")),
    )
    # Opportunistically clean up expired sessions.
    conn.execute("DELETE FROM sessions WHERE expires_at < ?", (db.now(),))
    conn.commit()
    return token


def user_for_token(conn: sqlite3.Connection, token: str | None) -> sqlite3.Row | None:
    if not token:
        return None
    return conn.execute(
        """SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
           WHERE sessions.token_hash = ? AND sessions.expires_at > ?""",
        (_token_hash(token), db.now()),
    ).fetchone()


def delete_session(conn: sqlite3.Connection, token: str | None) -> None:
    if token:
        conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))
        conn.commit()


class LoginThrottle:
    """Rejects logins for a key after too many recent failures."""

    def __init__(self, max_failures: int = 8, window_seconds: float = 600) -> None:
        self.max_failures = max_failures
        self.window = window_seconds
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, key: str) -> deque[float]:
        q = self._failures[key]
        cutoff = time.monotonic() - self.window
        while q and q[0] < cutoff:
            q.popleft()
        return q

    def blocked(self, key: str) -> bool:
        return len(self._prune(key)) >= self.max_failures

    def failed(self, key: str) -> None:
        self._prune(key).append(time.monotonic())

    def succeeded(self, key: str) -> None:
        self._failures.pop(key, None)
