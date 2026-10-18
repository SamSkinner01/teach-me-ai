from collections.abc import Callable


def numerical_gradient(f: Callable[[list[float]], float], x: list[float], h: float) -> list[float]:
    """Estimate the gradient of f at the point x with central differences.

    Entry i is (f(x + h·eᵢ) − f(x − h·eᵢ)) / (2h), where eᵢ is the unit
    vector along axis i.

    For f(x, y) = (x − 1)² + 2(y + 2)², the gradient at [0, 0] is about [-2, 8].
    """
    # TODO
    raise NotImplementedError
