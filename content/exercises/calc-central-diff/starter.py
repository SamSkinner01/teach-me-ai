from collections.abc import Callable


def central_difference(f: Callable[[float], float], x: float, h: float) -> float:
    """Estimate f'(x) with the central difference (f(x + h) - f(x - h)) / (2h).

    central_difference(lambda x: x * x, 3.0, 0.5) == 6.0
    """
    # TODO
    raise NotImplementedError
