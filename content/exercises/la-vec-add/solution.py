def vec_add(a: list[float], b: list[float]) -> list[float]:
    if len(a) != len(b):
        raise ValueError(f"cannot add vectors of length {len(a)} and {len(b)}")
    return [a[i] + b[i] for i in range(len(a))]
