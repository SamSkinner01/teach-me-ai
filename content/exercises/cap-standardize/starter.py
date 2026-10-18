def standardize(images: list[list[float]], mean: float, std: float) -> list[list[float]]:
    """Standardize every pixel of every image: (x - mean) / std.

standardize([[0.0, 1.0]], 0.5, 0.5) == [[-1.0, 1.0]]

Signal an error if std <= 0.
    """
    # TODO
    raise NotImplementedError
