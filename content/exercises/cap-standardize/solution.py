def standardize(images: list[list[float]], mean: float, std: float) -> list[list[float]]:
    if std <= 0:
        raise ValueError("std must be positive")
    return [[(x - mean) / std for x in row] for row in images]
