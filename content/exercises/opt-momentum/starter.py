from collections.abc import Callable


def momentum_descent(f: Callable[[list[float]], float], x0: list[float], lr: float,
                     beta: float, steps: int) -> list[float]:
    """Minimize f with momentum: start at x0 with zero velocity, and take
    `steps` momentum steps using numerical_gradient(f, x, 1e-5).
    Return the final x.

    Tip: `numerical_gradient` and `momentum_step` are in your library.
    """
    # TODO
    raise NotImplementedError
