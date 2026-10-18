def gather_labels(labels: list[int], idx: list[int]) -> list[int]:
    for i in idx:
        if not 0 <= i < len(labels):
            raise IndexError(f"label {i} is out of range")
    return [labels[i] for i in idx]
