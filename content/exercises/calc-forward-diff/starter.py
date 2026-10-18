from collections.abc import Callable


def forward_difference(f: Callable[[float], float], x: float, h: float) -> float:
    """Estimate f'(x) with the forward difference (f(x + h) - f(x)) / h.

    forward_difference(lambda x: x * x, 3.0, 0.5) == 6.5
    """
    # TODO
    raise NotImplementedError
