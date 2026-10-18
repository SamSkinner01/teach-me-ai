from collections.abc import Callable


def forward_difference(f: Callable[[float], float], x: float, h: float) -> float:
    return (f(x + h) - f(x)) / h
