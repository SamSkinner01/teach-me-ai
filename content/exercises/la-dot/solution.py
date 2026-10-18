def dot(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        raise ValueError(f"cannot take the dot product of lengths {len(a)} and {len(b)}")
    total = 0.0
    for i in range(len(a)):
        total += a[i] * b[i]
    return total
