from collections.abc import Callable


def gradient_descent(f: Callable[[list[float]], float], x0: list[float], lr: float, steps: int) -> list[float]:
    """Minimize f by gradient descent: start at x0 and take `steps` steps of
    x <- x - lr * gradient(f, x), using numerical_gradient with h = 1e-5.
    Return the final x.

    Tip: `numerical_gradient` and `gd_step` are in your library.
    """
    # TODO
    raise NotImplementedError
