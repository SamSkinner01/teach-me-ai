"""Sandbox driver: runs *inside* the sandbox (container or local temp dir).

It is executed as ``python3 -I -c <this source>`` and reads a job description
as JSON on stdin:

    {
      "workdir": "/tmp/job",
      "files": {"relative/path": "contents", ...},
      "steps": [
        {"name": "compile", "cmd": [...], "timeout": 30},
        {"name": "run", "cmd": [...], "timeout": 10, "results_fd": true}
      ],
      "apply_rlimits": false
    }

Steps run in order and stop at the first step that fails. A step with
``results_fd`` gets a pipe on file descriptor 3; the test harness writes its
structured results there so they never mix with the learner's own prints.

It prints a single JSON object on stdout: {"steps": [...]}.

This file must only use the standard library and must not import anything
from the backend package.
"""

import json
import os
import resource
import signal
import subprocess
import sys
import threading
import time

STDOUT_CAP = 64 * 1024
STDERR_CAP = 64 * 1024
RESULTS_CAP = 8 * 1024 * 1024


class _Reader(threading.Thread):
    """Drains a pipe, keeping at most ``cap`` bytes."""

    def __init__(self, fd, cap):
        super().__init__(daemon=True)
        self.fd = fd
        self.cap = cap
        self.chunks = []
        self.size = 0
        self.truncated = False

    def run(self):
        while True:
            try:
                data = os.read(self.fd, 65536)
            except OSError:
                break
            if not data:
                break
            room = self.cap - self.size
            if room > 0:
                self.chunks.append(data[:room])
                self.size += min(len(data), room)
            if len(data) > room:
                self.truncated = True
        os.close(self.fd)

    def text(self):
        return b"".join(self.chunks).decode("utf-8", errors="replace")


def _limits(timeout):
    def apply():
        cpu = int(timeout) + 2
        resource.setrlimit(resource.RLIMIT_CPU, (cpu, cpu))
        fsize = 64 * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_FSIZE, (fsize, fsize))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))

    return apply


def _reserve_fd3():
    """Keep fd 3 occupied so new pipes never land on it; run_step swaps the
    results pipe into that slot for the child and then puts this back."""
    fd = os.open(os.devnull, os.O_RDONLY)
    if fd != 3:
        os.dup2(fd, 3)
        os.close(fd)


def run_step(step, workdir, apply_rlimits):
    timeout = float(step.get("timeout", 10))
    want_results = bool(step.get("results_fd"))

    out_r, out_w = os.pipe()
    err_r, err_w = os.pipe()
    res_r = None
    pass_fds = ()
    if want_results:
        res_r, res_w = os.pipe()
        # The harness expects its results pipe on fd 3 exactly.
        os.dup2(res_w, 3)
        os.close(res_w)
        pass_fds = (3,)

    start = time.monotonic()
    try:
        proc = subprocess.Popen(
            step["cmd"],
            cwd=workdir,
            stdin=subprocess.DEVNULL,
            stdout=out_w,
            stderr=err_w,
            pass_fds=pass_fds,
            start_new_session=True,
            preexec_fn=_limits(timeout) if apply_rlimits else None,
        )
    except OSError as exc:
        for fd in (out_r, out_w, err_r, err_w) + ((res_r,) if want_results else ()):
            os.close(fd)
        _reserve_fd3()
        return {
            "name": step["name"],
            "exit_code": 127,
            "signal": None,
            "timed_out": False,
            "time_ms": 0,
            "stdout": "",
            "stderr": f"could not start {step['cmd'][0]}: {exc}",
            "results": "",
            "truncated": False,
        }

    os.close(out_w)
    os.close(err_w)
    if want_results:
        _reserve_fd3()

    readers = [_Reader(out_r, STDOUT_CAP), _Reader(err_r, STDERR_CAP)]
    if want_results:
        readers.append(_Reader(res_r, RESULTS_CAP))
    for r in readers:
        r.start()

    timed_out = False
    try:
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait()
    elapsed = time.monotonic() - start

    # Anything still holding the pipes open belongs to the same process group.
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass
    for r in readers:
        r.join(timeout=2)

    code = proc.returncode
    sig = None
    if code is not None and code < 0:
        try:
            sig = signal.Signals(-code).name
        except ValueError:
            sig = str(-code)

    return {
        "name": step["name"],
        "exit_code": code,
        "signal": sig,
        "timed_out": timed_out,
        "time_ms": int(elapsed * 1000),
        "stdout": readers[0].text(),
        "stderr": readers[1].text(),
        "results": readers[2].text() if want_results else "",
        "truncated": any(r.truncated for r in readers),
    }


def main():
    _reserve_fd3()
    job = json.load(sys.stdin)
    workdir = job.get("workdir") or "/tmp/job"
    os.makedirs(workdir, exist_ok=True)
    for rel, content in job["files"].items():
        path = os.path.normpath(os.path.join(workdir, rel))
        if not path.startswith(os.path.normpath(workdir) + os.sep):
            raise SystemExit(f"refusing to write outside workdir: {rel}")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    results = []
    for step in job["steps"]:
        result = run_step(step, workdir, bool(job.get("apply_rlimits")))
        results.append(result)
        if result["exit_code"] != 0 or result["timed_out"]:
            break

    sys.stdout.write(json.dumps({"steps": results}))
    sys.stdout.flush()


main()
