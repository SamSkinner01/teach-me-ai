def accuracy(logits: list[list[float]], labels: list[int]) -> float:
    if len(logits) != len(labels) or not logits:
        raise ValueError("need exactly one label per row")
    correct = sum(1 for row, y in zip(logits, labels) if argmax(row) == y)
    return correct / len(logits)
