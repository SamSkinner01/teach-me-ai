"""Loads the course structure and exercise definitions from the content directory.

Layout:
    content/course.json                    modules -> lessons -> exercise ids
    content/exercises/<id>/exercise.json   signature, tests, hints
    content/exercises/<id>/starter.{py,rs,cpp}
    content/exercises/<id>/solution.{py,rs,cpp}
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .runner.codegen import LANGUAGES

EXTENSIONS = {"python": "py", "rust": "rs", "cpp": "cpp"}
LANGUAGE_NAMES = {"python": "Python", "rust": "Rust", "cpp": "C++"}


@dataclass
class Exercise:
    id: str
    title: str
    function: str
    params: list[dict[str, str]]
    returns: str
    library: bool
    tests: list[dict[str, Any]]
    hints: list[str]
    tolerance: dict[str, float]
    time_limit: float
    starters: dict[str, str]
    solutions: dict[str, str]
    lesson_id: str = ""
    # "function" (graded against tests) or "training" (a long run graded on test accuracy)
    kind: str = "function"
    # For training exercises: per-language defaults, limits and pass threshold.
    training: dict[str, dict[str, Any]] = field(default_factory=dict)

    def spec(self) -> dict[str, Any]:
        return {
            "function": self.function,
            "params": self.params,
            "returns": self.returns,
            "tolerance": self.tolerance,
            "time_limit": self.time_limit,
        }

    def indexed_tests(self, include_hidden: bool) -> list[tuple[int, dict[str, Any]]]:
        return [(i, t) for i, t in enumerate(self.tests) if include_hidden or not t.get("hidden")]


@dataclass
class Lesson:
    id: str
    title: str
    summary: str
    module_id: str
    exercises: list[str] = field(default_factory=list)


@dataclass
class Module:
    id: str
    number: int
    title: str
    summary: str
    coming_soon: bool
    lessons: list[Lesson]
    planned: list[str] = field(default_factory=list)


class CourseError(Exception):
    pass


class Course:
    def __init__(self, modules: list[Module], exercises: dict[str, Exercise]) -> None:
        self.modules = modules
        self.exercises = exercises
        self.lessons: dict[str, Lesson] = {}
        self.lesson_order: list[str] = []
        self.exercise_order: list[str] = []
        for module in modules:
            for lesson in module.lessons:
                self.lessons[lesson.id] = lesson
                self.lesson_order.append(lesson.id)
                for ex_id in lesson.exercises:
                    self.exercise_order.append(ex_id)
                    exercises[ex_id].lesson_id = lesson.id

    def library_before(self, exercise_id: str) -> list[Exercise]:
        """Library exercises that come before ``exercise_id`` in course order."""
        position = self.exercise_order.index(exercise_id)
        return [self.exercises[e] for e in self.exercise_order[:position] if self.exercises[e].library]

    def previous_lesson(self, lesson_id: str) -> str | None:
        i = self.lesson_order.index(lesson_id)
        return self.lesson_order[i - 1] if i > 0 else None

    def to_public(self) -> dict[str, Any]:
        return {
            "languages": [{"id": lang, "name": LANGUAGE_NAMES[lang]} for lang in LANGUAGES],
            "modules": [
                {
                    "id": m.id,
                    "number": m.number,
                    "title": m.title,
                    "summary": m.summary,
                    "coming_soon": m.coming_soon,
                    "planned": m.planned,
                    "lessons": [
                        {
                            "id": lesson.id,
                            "title": lesson.title,
                            "summary": lesson.summary,
                            "exercises": [
                                {"id": e, "title": self.exercises[e].title, "function": self.exercises[e].function}
                                for e in lesson.exercises
                            ],
                        }
                        for lesson in m.lessons
                    ],
                }
                for m in self.modules
            ],
        }

    @classmethod
    def load(cls, content_dir: Path, require_expected: bool = True) -> "Course":
        course_file = content_dir / "course.json"
        data = json.loads(course_file.read_text(encoding="utf-8"))

        exercises: dict[str, Exercise] = {}
        modules: list[Module] = []
        for number, m in enumerate(data["modules"]):
            lessons = []
            for lesson_data in m.get("lessons", []):
                lesson = Lesson(
                    id=lesson_data["id"],
                    title=lesson_data["title"],
                    summary=lesson_data.get("summary", ""),
                    module_id=m["id"],
                    exercises=list(lesson_data.get("exercises", [])),
                )
                for ex_id in lesson.exercises:
                    if ex_id in exercises:
                        raise CourseError(f"exercise {ex_id} is listed twice")
                    exercises[ex_id] = _load_exercise(content_dir / "exercises" / ex_id, ex_id, require_expected)
                lessons.append(lesson)
            modules.append(
                Module(
                    id=m["id"],
                    number=m.get("number", number),
                    title=m["title"],
                    summary=m.get("summary", ""),
                    coming_soon=bool(m.get("coming_soon")),
                    lessons=lessons,
                    planned=list(m.get("planned", [])),
                )
            )
        return cls(modules, exercises)


def _load_exercise(directory: Path, ex_id: str, require_expected: bool) -> Exercise:
    if not directory.is_dir():
        raise CourseError(f"missing exercise directory {directory}")
    data = json.loads((directory / "exercise.json").read_text(encoding="utf-8"))
    starters, solutions = {}, {}
    for lang, ext in EXTENSIONS.items():
        for kind, target in (("starter", starters), ("solution", solutions)):
            path = directory / f"{kind}.{ext}"
            if not path.exists():
                raise CourseError(f"{ex_id}: missing {path.name}")
            target[lang] = path.read_text(encoding="utf-8")
    kind = data.get("kind", "function")
    if kind not in ("function", "training"):
        raise CourseError(f"{ex_id}: unknown kind {kind!r}")
    if kind == "training":
        missing = [lang for lang in EXTENSIONS if lang not in data.get("training", {})]
        if missing:
            raise CourseError(f"{ex_id}: training settings missing for {', '.join(missing)}")
    for i, test in enumerate(data["tests"]):
        if len(test["args"]) != len(data["params"]):
            raise CourseError(f"{ex_id}: test {i} has {len(test['args'])} args, expected {len(data['params'])}")
        if require_expected and "expected" not in test and not test.get("expect_error"):
            raise CourseError(f"{ex_id}: test {i} has no expected value (run scripts/fill_expected.py)")
    return Exercise(
        id=ex_id,
        title=data["title"],
        function=data["function"],
        params=data["params"],
        returns=data["returns"],
        library=data.get("library", True),
        tests=data["tests"],
        hints=data.get("hints", []),
        tolerance=data.get("tolerance", {}),
        time_limit=float(data.get("time_limit", 10)),
        starters=starters,
        solutions=solutions,
        kind=kind,
        training=data.get("training", {}),
    )
