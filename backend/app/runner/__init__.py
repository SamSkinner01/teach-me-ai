"""Code execution: harness generation, sandboxing and grading."""

from __future__ import annotations

import asyncio
from typing import Any

from .codegen import LibraryEntry, build_job
from .grading import Report, build_report
from .sandbox import DockerSandbox, LocalSandbox, Sandbox, SandboxError

__all__ = ["LibraryEntry", "Report", "Runner", "Sandbox", "SandboxError", "DockerSandbox", "LocalSandbox"]


class Runner:
    """Runs learner code against tests, limiting how many jobs run at once."""

    def __init__(self, sandbox: Sandbox, max_concurrent: int = 4) -> None:
        self.sandbox = sandbox
        self._slots = asyncio.Semaphore(max_concurrent)

    async def run(
        self,
        language: str,
        spec: dict[str, Any],
        code: str,
        tests: list[tuple[int, dict[str, Any]]],
        library: list[LibraryEntry],
        used_reference: list[str] | None = None,
    ) -> Report:
        job = build_job(language, spec, [(i, t["args"]) for i, t in tests], code, library)
        async with self._slots:
            result = await self.sandbox.execute(job)
        return build_report(spec, tests, result, used_reference)
