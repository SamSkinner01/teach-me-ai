from fastapi.testclient import TestClient

from app.main import create_app
from app.runner import LocalSandbox

from .conftest import make_settings, register

VEC_SUM = "def vec_sum(v):\n    total = 0.0\n    for x in v:\n        total += x\n    return total\n"
WRONG_VEC_SUM = "def vec_sum(v):\n    return 0.0\n"


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------


def test_register_login_logout(client):
    me = register(client)
    assert me["user"]["username"] == "ada"
    assert me["tracks"] == []

    assert client.get("/api/auth/me").status_code == 200
    client.post("/api/auth/logout", json={})
    assert client.get("/api/auth/me").status_code == 401

    r = client.post("/api/auth/login", json={"username": "ADA", "password": "correct horse"})
    assert r.status_code == 200, "usernames are case-insensitive"
    assert client.get("/api/auth/me").status_code == 200


def test_session_endpoint_never_errors(client):
    assert client.get("/api/auth/session").json() == {"me": None}
    register(client)
    assert client.get("/api/auth/session").json()["me"]["user"]["username"] == "ada"


def test_register_validation_and_duplicates(client):
    assert client.post("/api/auth/register", json={"username": "x", "password": "longenough"}).status_code == 400
    assert client.post("/api/auth/register", json={"username": "bob", "password": "short"}).status_code == 400
    register(client, "bob")
    client.post("/api/auth/logout", json={})
    r = client.post("/api/auth/register", json={"username": "Bob", "password": "another password"})
    assert r.status_code == 409


def test_wrong_password_and_throttle(client):
    register(client)
    client.post("/api/auth/logout", json={})
    for _ in range(8):
        r = client.post("/api/auth/login", json={"username": "ada", "password": "wrong password"})
        assert r.status_code == 401
    r = client.post("/api/auth/login", json={"username": "ada", "password": "correct horse"})
    assert r.status_code == 429


def test_session_cookie_is_httponly(client):
    r = client.post("/api/auth/register", json={"username": "ada", "password": "correct horse"})
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie


def test_writes_must_be_json(client):
    r = client.post("/api/auth/login", content="username=ada&password=x",
                    headers={"content-type": "application/x-www-form-urlencoded"})
    assert r.status_code == 415


def test_delete_account(client):
    register(client)
    assert client.post("/api/auth/delete", json={"password": "nope nope"}).status_code == 401
    assert client.post("/api/auth/delete", json={"password": "correct horse"}).status_code == 200
    assert client.post("/api/auth/login", json={"username": "ada", "password": "correct horse"}).status_code == 401


def test_registration_can_be_closed(tmp_path):
    app = create_app(make_settings(tmp_path, allow_registration=False), sandbox=LocalSandbox())
    with TestClient(app) as c:
        r = c.post("/api/auth/register", json={"username": "ada", "password": "correct horse"})
        assert r.status_code == 403


# --------------------------------------------------------------------------
# Tracks & progress
# --------------------------------------------------------------------------


def test_course_is_public(client):
    course = client.get("/api/course").json()
    assert [lang["id"] for lang in course["languages"]] == ["python", "rust", "cpp"]
    assert course["modules"][0]["lessons"][0]["id"] == "welcome"


def test_language_must_be_chosen_first(client):
    register(client)
    assert client.get("/api/progress").status_code == 409
    assert client.post("/api/tracks", json={"language": "cobol"}).status_code == 422


def test_tracks_are_separate(client):
    register(client)
    me = client.post("/api/tracks", json={"language": "python"}).json()
    python_id = me["active_track_id"]
    client.post("/api/lessons/welcome/complete", json={})
    assert client.get("/api/progress").json()["lessons"]["welcome"]["completed"]

    me = client.post("/api/tracks", json={"language": "rust"}).json()
    assert me["active_track_id"] != python_id
    assert len(me["tracks"]) == 2
    progress = client.get("/api/progress").json()
    assert progress["track"]["language"] == "rust"
    assert not progress["lessons"]["welcome"]["completed"]

    client.put("/api/tracks/active", json={"track_id": python_id})
    assert client.get("/api/progress").json()["lessons"]["welcome"]["completed"]


def test_cannot_use_someone_elses_track(client):
    register(client, "ada")
    other = client.post("/api/tracks", json={"language": "python"}).json()["active_track_id"]
    client.post("/api/auth/logout", json={})
    register(client, "eve")
    assert client.put("/api/tracks/active", json={"track_id": other}).status_code == 404


def test_lessons_unlock_in_order(python_learner):
    c = python_learner
    lessons = c.get("/api/progress").json()["lessons"]
    assert lessons["welcome"]["unlocked"]
    assert not lessons["how-it-works"]["unlocked"]
    assert c.get("/api/exercises/warmup-vec-sum").status_code == 403

    assert c.post("/api/lessons/welcome/complete", json={}).status_code == 200
    assert c.get("/api/exercises/warmup-vec-sum").status_code == 200
    # A lesson with exercises can't be completed until they pass.
    assert c.post("/api/lessons/how-it-works/complete", json={}).status_code == 409


def test_unlock_all_setting(tmp_path):
    app = create_app(make_settings(tmp_path, unlock_all=True), sandbox=LocalSandbox())
    with TestClient(app) as c:
        register(c)
        c.post("/api/tracks", json={"language": "python"})
        assert c.get("/api/exercises/calc-gradient-check").status_code == 200


# --------------------------------------------------------------------------
# Exercises
# --------------------------------------------------------------------------


def test_exercise_payload_hides_hidden_tests(python_learner):
    c = python_learner
    c.post("/api/lessons/welcome/complete", json={})
    ex = c.get("/api/exercises/warmup-vec-sum").json()
    assert ex["language"] == "python"
    assert ex["code"] == ex["starter"]
    assert ex["hidden_count"] > 0
    assert all("expected" in t for t in ex["tests"])
    assert "solution" not in ex


def test_run_submit_pass_and_complete(python_learner):
    c = python_learner
    c.post("/api/lessons/welcome/complete", json={})

    run = c.post("/api/exercises/warmup-vec-sum/run", json={"code": VEC_SUM}).json()
    assert run["report"]["status"] == "passed"
    assert run["report"]["total"] < 5, "run only uses visible tests"
    assert not run["passed"], "running does not count as passing"

    sub = c.post("/api/exercises/warmup-vec-sum/submit", json={"code": VEC_SUM}).json()
    assert sub["report"]["status"] == "passed"
    assert sub["report"]["total"] == 5
    assert sub["passed"] and sub["attempts"] == 1

    assert c.post("/api/lessons/how-it-works/complete", json={}).status_code == 200
    assert c.get("/api/progress").json()["lessons"]["vectors"]["unlocked"]

    history = c.get("/api/exercises/warmup-vec-sum/submissions").json()
    assert len(history) == 1 and history[0]["status"] == "passed"

    lib = c.get("/api/library").json()
    entry = next(f for f in lib["functions"] if f["function"] == "vec_sum")
    assert entry["code"] == VEC_SUM


def test_failed_submission_and_solution_unlock(python_learner):
    c = python_learner
    c.post("/api/lessons/welcome/complete", json={})
    assert c.get("/api/exercises/warmup-vec-sum/solution").status_code == 403
    for i in range(3):
        sub = c.post("/api/exercises/warmup-vec-sum/submit", json={"code": WRONG_VEC_SUM}).json()
        assert sub["report"]["status"] == "failed"
        assert not sub["passed"]
        hidden = [t for t in sub["report"]["tests"] if t["hidden"]]
        assert hidden and all(t["args"] is None for t in hidden), "hidden inputs are not revealed"
    assert sub["solution_available"]
    assert "def vec_sum" in c.get("/api/exercises/warmup-vec-sum/solution").json()["code"]


def test_drafts_are_saved(python_learner):
    c = python_learner
    c.post("/api/lessons/welcome/complete", json={})
    c.put("/api/exercises/warmup-vec-sum/draft", json={"code": "# my draft\n"})
    assert c.get("/api/exercises/warmup-vec-sum").json()["code"] == "# my draft\n"


def test_library_uses_learner_code(tmp_path):
    """Later exercises run against the learner's own earlier functions."""
    app = create_app(make_settings(tmp_path, unlock_all=True), sandbox=LocalSandbox())
    with TestClient(app) as c:
        register(c)
        c.post("/api/tracks", json={"language": "python"})
        norm = "import math\ndef norm(v):\n    return math.sqrt(dot(v, v))\n"

        # Without a passing `dot`, the reference version fills in, and we say so.
        report = c.post("/api/exercises/la-norm/run", json={"code": norm}).json()["report"]
        assert report["status"] == "passed"
        assert "dot" in report["used_reference"]

        # A buggy-but-passing-looking dot is *not* saved (it fails its tests)...
        buggy = "def dot(a, b):\n    return 0.0\n"
        assert not c.post("/api/exercises/la-dot/submit", json={"code": buggy}).json()["passed"]

        # ...but once the learner's own dot passes, it's what norm calls.
        dot = (
            "def dot(a, b):\n"
            "    if len(a) != len(b):\n        raise ValueError('len')\n"
            "    print('my dot')\n"
            "    return sum(x * y for x, y in zip(a, b))\n"
        )
        assert c.post("/api/exercises/la-dot/submit", json={"code": dot}).json()["passed"]
        report = c.post("/api/exercises/la-norm/run", json={"code": norm}).json()["report"]
        assert report["status"] == "passed"
        assert "dot" not in report["used_reference"]
        assert "my dot" in report["stdout"]


def test_code_size_limit(python_learner):
    c = python_learner
    c.post("/api/lessons/welcome/complete", json={})
    r = c.post("/api/exercises/warmup-vec-sum/run", json={"code": "#" * 200_000})
    assert r.status_code == 422


def test_unknown_api_route_is_404(client):
    assert client.get("/api/nope").status_code == 404


def test_index_html_is_not_cached(tmp_path):
    static = tmp_path / "dist"
    (static / "assets").mkdir(parents=True)
    (static / "index.html").write_text("<!doctype html><title>t</title>")
    app = create_app(make_settings(tmp_path, static_dir=static), sandbox=LocalSandbox())
    with TestClient(app) as c:
        r = c.get("/learn/vectors")
        assert r.status_code == 200 and "<title>t</title>" in r.text
        assert r.headers["cache-control"] == "no-cache"
