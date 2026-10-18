def confusion_matrix(predicted: list[int], actual: list[int], classes: int) -> list[list[float]]:
    if len(predicted) != len(actual):
        raise ValueError("one prediction per example")
    m = [[0.0] * classes for _ in range(classes)]
    for p, a in zip(predicted, actual):
        if p >= classes or a >= classes:
            raise ValueError("class out of range")
        m[a][p] += 1
    return m
