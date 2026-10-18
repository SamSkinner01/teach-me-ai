"""Runner integration tests: real compilers, LocalSandbox (and Docker if available)."""

import shutil
import subprocess

import pytest

from app.runner import DockerSandbox, LibraryEntry, LocalSandbox, Runner

from .conftest import HAS_TOOLCHAINS

pytestmark = pytest.mark.skipif(not HAS_TOOLCHAINS, reason="needs python3, rustc and g++")

SPEC = {"function": "dot", "params": [{"name": "a", "type": "vec"}, {"name": "b", "type": "vec"}],
        "returns": "float", "time_limit": 3}
TESTS = [
    (0, {"args": [[1, 2, 3], [4, 5, 6]], "expected": 32.0}),
    (1, {"args": [[1, 2], [1]], "expect_error": True, "hidden": True}),
]

GOOD = {
    "python": "def dot(a, b):\n    if len(a) != len(b):\n        raise ValueError('x')\n    return sum(x*y for x, y in zip(a, b))\n",
    "rust": "pub fn dot(a: &[f64], b: &[f64]) -> f64 {\n    assert_eq!(a.len(), b.len());\n    a.iter().zip(b).map(|(x, y)| x * y).sum()\n}\n",
    "cpp": "#include <vector>\n#include <stdexcept>\ndouble dot(const std::vector<double>& a, const std::vector<double>& b) {\n    if (a.size() != b.size()) throw std::invalid_argument(\"x\");\n    double s = 0; for (std::size_t i = 0; i < a.size(); ++i) s += a[i] * b[i]; return s;\n}\n",
}
STARTER = {
    "python": "def dot(a, b):\n    raise NotImplementedError\n",
    "rust": "pub fn dot(a: &[f64], b: &[f64]) -> f64 {\n    todo!()\n}\n",
    "cpp": "#include <stdexcept>\n#include <vector>\ndouble dot(const std::vector<double>& a, const std::vector<double>& b) {\n    throw std::logic_error(\"not implemented\");\n}\n",
}
BROKEN = {
    "python": "def dot(a, b)\n    return 0\n",
    "rust": "pub fn dot(a: &[f64], b: &[f64]) -> f64 {\n    \"oops\"\n}\n",
    "cpp": "double dot(const std::vector<double>& a, const std::vector<double>& b) {\n    return a.lenght();\n}\n",
}
LOOP = {
    "python": "def dot(a, b):\n    while True:\n        pass\n",
    "rust": "pub fn dot(a: &[f64], b: &[f64]) -> f64 {\n    loop {}\n}\n",
    "cpp": "double dot(const std::vector<double>& a, const std::vector<double>& b) {\n    volatile int x = 0; while (true) { x++; }\n}\n",
}


def _docker_ready() -> bool:
    if shutil.which("docker") is None:
        return False
    r = subprocess.run(["docker", "image", "inspect", "teach-me-ai-runner:latest"], capture_output=True)
    return r.returncode == 0


SANDBOXES = [pytest.param(LocalSandbox, id="local")]
if _docker_ready():
    SANDBOXES.append(pytest.param(lambda: DockerSandbox("teach-me-ai-runner:latest"), id="docker"))


@pytest.fixture(params=SANDBOXES)
def runner(request):
    return Runner(request.param())


LANGS = ["python", "rust", "cpp"]


@pytest.mark.parametrize("lang", LANGS)
async def test_correct_solution_passes(runner, lang):
    report = await runner.run(lang, SPEC, GOOD[lang], TESTS, [])
    assert report.status == "passed", report


@pytest.mark.parametrize("lang", LANGS)
async def test_starter_is_not_implemented(runner, lang):
    report = await runner.run(lang, SPEC, STARTER[lang], TESTS, [])
    assert report.status == "failed"
    assert report.passed == 0, "a TODO must not count as 'raised the expected error'"
    assert all("Not implemented" in t.message for t in report.tests)


@pytest.mark.parametrize("lang", LANGS)
async def test_compile_errors_point_at_solution(runner, lang):
    report = await runner.run(lang, SPEC, BROKEN[lang], TESTS, [])
    assert report.status in ("compile_error", "load_error")
    assert "solution." in report.compile_output


@pytest.mark.parametrize("lang", LANGS)
async def test_infinite_loop_times_out(runner, lang):
    report = await runner.run(lang, SPEC, LOOP[lang], TESTS, [])
    assert report.status == "timeout"


@pytest.mark.parametrize("lang", LANGS)
async def test_library_code_is_available(runner, lang):
    spec = {"function": "norm", "params": [{"name": "v", "type": "vec"}], "returns": "float"}
    code = {
        "python": "import math\ndef norm(v):\n    return math.sqrt(dot(v, v))\n",
        "rust": "pub fn norm(v: &[f64]) -> f64 { dot(v, v).sqrt() }\n",
        "cpp": "#include <cmath>\ndouble norm(const std::vector<double>& v) { return std::sqrt(dot(v, v)); }\n",
    }[lang]
    report = await runner.run(lang, spec, code, [(0, {"args": [[3, 4]], "expected": 5.0})],
                              [LibraryEntry("la-dot", GOOD[lang])])
    assert report.status == "passed", report


async def test_rust_signature_change_gets_a_hint(runner):
    code = "pub fn dot(a: &[f64], b: &[f64]) -> Vec<f64> { vec![] }\n"
    report = await runner.run("rust", SPEC, code, TESTS, [])
    assert report.status == "compile_error"
    assert "signature" in report.message


async def test_cpp_segfault_is_reported(runner):
    code = "double dot(const std::vector<double>& a, const std::vector<double>& b) { volatile double* p = nullptr; return *p; }\n"
    report = await runner.run("cpp", SPEC, code, TESTS, [])
    assert report.status == "crashed"
    assert "segmentation fault" in report.message


async def test_user_output_is_captured_separately(runner):
    code = "def dot(a, b):\n    print('debug', a)\n    return sum(x*y for x, y in zip(a, b)) if len(a) == len(b) else 1/0\n"
    report = await runner.run("python", SPEC, code, TESTS, [])
    assert report.status == "passed"
    assert "debug [1.0, 2.0, 3.0]" in report.stdout
