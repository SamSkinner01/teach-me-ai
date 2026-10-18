from collections.abc import Callable


def numerical_gradient(f: Callable[[list[float]], float], x: list[float], h: float) -> list[float]:
    grad = []
    for i in range(len(x)):
        plus = list(x)
        minus = list(x)
        plus[i] += h
        minus[i] -= h
        grad.append((f(plus) - f(minus)) / (2 * h))
    return grad
