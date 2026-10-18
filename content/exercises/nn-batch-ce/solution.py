def batch_cross_entropy(logits: list[list[float]], labels: list[int]) -> float:
    if len(logits) != len(labels) or not logits:
        raise ValueError("need exactly one label per row")
    return sum(cross_entropy_loss(row, y) for row, y in zip(logits, labels)) / len(logits)
