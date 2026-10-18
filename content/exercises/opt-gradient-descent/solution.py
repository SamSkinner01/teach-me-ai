from collections.abc import Callable


def gradient_descent(f: Callable[[list[float]], float], x0: list[float], lr: float, steps: int) -> list[float]:
    x = list(x0)
    for _ in range(steps):
        x = gd_step(x, numerical_gradient(f, x, 1e-5), lr)
    return x
