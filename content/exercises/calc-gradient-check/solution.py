from collections.abc import Callable


def gradient_check(f: Callable[[list[float]], float], x: list[float], analytic: list[float]) -> float:
    return relative_error(analytic, numerical_gradient(f, x, 1e-5))
