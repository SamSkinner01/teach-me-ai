from collections.abc import Callable


def gradient_check(f: Callable[[list[float]], float], x: list[float], analytic: list[float]) -> float:
    """Return the relative error between `analytic` (a gradient you derived
    by hand) and the numerical gradient of f at x, using h = 1e-5.

    Values below ~1e-7 mean the analytic gradient is almost certainly right.

    Tip: `numerical_gradient` and `relative_error` are available.
    """
    # TODO
    raise NotImplementedError
