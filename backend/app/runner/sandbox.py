"""Executes sandbox jobs.

Two implementations share the same driver script (``driver.py``):

* ``DockerSandbox`` (the default) starts a throwaway container per job with
  no network, a read-only root filesystem, dropped capabilities, a non-root
  user and memory / CPU / process limits. Use this whenever anyone other than
  you can submit code.
* ``LocalSandbox`` runs the driver directly on the host in a temp directory
  with only CPU-time and file-size limits. It is for development on a machine
  without Docker and must never be exposed to other users.
"""

from __future__ import annotations

import asyncio
import json
import shutil
import sys
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Protocol

from .codegen import Job

DRIVER_SOURCE = (Path(__file__).parent / "driver.py").read_text(encoding="utf-8")


class SandboxError(Exception):
    """The sandbox itself failed (not the learner's code)."""


@dataclass
class StepResult:
    name: str
    exit_code: int | None
    signal: str | None
    timed_out: bool
    time_ms: int
    stdout: str
    stderr: str
    results: str
    truncated: bool


@dataclass
class JobResult:
    steps: list[StepResult]

    def step(self, name: str) -> StepResult | None:
        return next((s for s in self.steps if s.name == name), None)


def _parse(raw: bytes, stderr: bytes) -> JobResult:
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        detail = stderr.decode("utf-8", errors="replace")[-2000:]
        raise SandboxError(f"sandbox returned invalid output: {exc}; stderr: {detail}") from exc
    return JobResult(steps=[StepResult(**s) for s in data["steps"]])


LineCallback = Callable[[str], None]


class Sandbox(Protocol):
    name: str
    # Where the MNIST files live, as seen from inside this sandbox.
    data_dir: str

    async def execute(self, job: Job) -> JobResult: ...

    async def execute_stream(self, job: Job, on_line: LineCallback) -> JobResult: ...

    async def check(self) -> tuple[bool, str]: ...


def _job_payload(job: Job, workdir: str, apply_rlimits: bool, stream: bool = False) -> bytes:
    payload: dict[str, Any] = {
        "workdir": workdir,
        "files": job.files,
        "steps": job.steps,
        "apply_rlimits": apply_rlimits,
        "stream": stream,
    }
    return json.dumps(payload).encode("utf-8")


async def _read_stream(proc: asyncio.subprocess.Process, on_line: LineCallback) -> JobResult:
    """Consume the driver's streamed events until the final "done" event."""
    assert proc.stdout is not None
    while True:
        raw = await proc.stdout.readline()
        if not raw:
            break
        try:
            event = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if event.get("event") == "line":
            on_line(event["line"])
        elif event.get("event") == "done":
            await proc.wait()
            return JobResult(steps=[StepResult(**st) for st in event["steps"]])
    await proc.wait()
    err = (await proc.stderr.read()).decode("utf-8", errors="replace")[-2000:] if proc.stderr else ""
    raise SandboxError(f"the sandbox stopped without finishing (exit {proc.returncode}): {err}")


def _total_timeout(job: Job) -> float:
    return sum(float(s.get("timeout", 10)) for s in job.steps) + 30


class DockerSandbox:
    name = "docker"

    data_dir = "/data/mnist"

    def __init__(
        self,
        image: str,
        memory: str = "768m",
        cpus: str = "1",
        pids: int = 128,
        docker_bin: str = "docker",
    ) -> None:
        self.image = image
        self.memory = memory
        self.cpus = cpus
        self.pids = pids
        self.docker = docker_bin

    def _command(self, container: str, memory: str | None = None) -> list[str]:
        memory = memory or self.memory
        return [
            self.docker, "run", "--rm", "-i",
            "--name", container,
            "--network", "none",
            "--memory", memory,
            "--memory-swap", memory,
            "--cpus", self.cpus,
            "--pids-limit", str(self.pids),
            "--read-only",
            "--tmpfs", "/tmp:rw,exec,nosuid,nodev,size=256m",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "--user", "10001:10001",
            "--env", "HOME=/tmp",
            "--log-driver", "none",
            self.image,
            "python3", "-I", "-c", DRIVER_SOURCE,
        ]

    async def execute(self, job: Job) -> JobResult:
        container = f"tmai-run-{uuid.uuid4().hex[:12]}"
        proc = await asyncio.create_subprocess_exec(
            *self._command(container),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            out, err = await asyncio.wait_for(
                proc.communicate(_job_payload(job, "/tmp/job", apply_rlimits=False)),
                timeout=_total_timeout(job),
            )
        except (TimeoutError, asyncio.CancelledError):
            await self._kill(container)
            proc.kill()
            await proc.wait()
            raise SandboxError("the sandbox did not finish in time") from None
        if proc.returncode != 0 and not out:
            raise SandboxError(
                f"docker exited with {proc.returncode}: {err.decode('utf-8', errors='replace')[-2000:]}"
            )
        return _parse(out, err)

    async def execute_stream(self, job: Job, on_line: LineCallback) -> JobResult:
        container = f"tmai-train-{uuid.uuid4().hex[:12]}"
        proc = await asyncio.create_subprocess_exec(
            *self._command(container, job.extra.get("memory")),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            limit=32 * 1024 * 1024,
        )
        assert proc.stdin is not None
        proc.stdin.write(_job_payload(job, "/tmp/job", apply_rlimits=False, stream=True))
        await proc.stdin.drain()
        proc.stdin.close()
        try:
            return await asyncio.wait_for(_read_stream(proc, on_line), timeout=_total_timeout(job))
        except (TimeoutError, asyncio.CancelledError) as exc:
            await self._kill(container)
            proc.kill()
            await proc.wait()
            if isinstance(exc, asyncio.CancelledError):
                raise
            raise SandboxError("the sandbox did not finish in time") from None

    async def _kill(self, container: str) -> None:
        killer = await asyncio.create_subprocess_exec(
            self.docker, "kill", container,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL,
        )
        await killer.wait()

    async def check(self) -> tuple[bool, str]:
        try:
            proc = await asyncio.create_subprocess_exec(
                self.docker, "image", "inspect", self.image,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError:
            return False, f"`{self.docker}` is not installed"
        _, err = await proc.communicate()
        if proc.returncode != 0:
            return False, f"runner image {self.image!r} not found; build it with scripts/build-runner-image.sh"
        return True, f"docker image {self.image}"


class LocalSandbox:
    """Development-only sandbox: runs code directly on the host."""

    name = "local"

    def __init__(self, data_dir: str | Path | None = None) -> None:
        self.data_dir = str(data_dir or Path(__file__).resolve().parents[3] / "data" / "mnist" / "raw")

    async def execute(self, job: Job) -> JobResult:
        workdir = tempfile.mkdtemp(prefix="tmai-job-")
        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-I", "-c", DRIVER_SOURCE,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                out, err = await asyncio.wait_for(
                    proc.communicate(_job_payload(job, workdir, apply_rlimits=True)),
                    timeout=_total_timeout(job),
                )
            except (TimeoutError, asyncio.CancelledError):
                proc.kill()
                await proc.wait()
                raise SandboxError("the sandbox did not finish in time") from None
            return _parse(out, err)
        finally:
            shutil.rmtree(workdir, ignore_errors=True)

    async def execute_stream(self, job: Job, on_line: LineCallback) -> JobResult:
        workdir = tempfile.mkdtemp(prefix="tmai-train-")
        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-I", "-c", DRIVER_SOURCE,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                limit=32 * 1024 * 1024,
            )
            assert proc.stdin is not None
            proc.stdin.write(_job_payload(job, workdir, apply_rlimits=True, stream=True))
            await proc.stdin.drain()
            proc.stdin.close()
            try:
                return await asyncio.wait_for(_read_stream(proc, on_line), timeout=_total_timeout(job))
            except (TimeoutError, asyncio.CancelledError) as exc:
                # SIGTERM lets the driver kill the learner's process group first.
                proc.terminate()
                try:
                    await asyncio.wait_for(proc.wait(), timeout=5)
                except TimeoutError:
                    proc.kill()
                    await proc.wait()
                if isinstance(exc, asyncio.CancelledError):
                    raise
                raise SandboxError("the sandbox did not finish in time") from None
        finally:
            shutil.rmtree(workdir, ignore_errors=True)

    async def check(self) -> tuple[bool, str]:
        missing = [tool for tool in ("python3", "rustc", "g++") if shutil.which(tool) is None]
        if missing:
            return False, "missing toolchains: " + ", ".join(missing)
        return True, "local (development only, not isolated)"
