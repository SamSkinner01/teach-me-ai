from collections.abc import Callable


def momentum_descent(f: Callable[[list[float]], float], x0: list[float], lr: float,
                     beta: float, steps: int) -> list[float]:
    x = list(x0)
    v = [0.0] * len(x0)
    for _ in range(steps):
        x, v = momentum_step(x, v, numerical_gradient(f, x, 1e-5), lr, beta)
    return x
