def batch_cross_entropy_grad(logits: list[list[float]], labels: list[int]) -> list[list[float]]:
    if len(logits) != len(labels) or not logits:
        raise ValueError("need exactly one label per row")
    n = len(logits)
    return [vec_scale(cross_entropy_grad(row, y), 1.0 / n) for row, y in zip(logits, labels)]
