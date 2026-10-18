def argmax(v: list[float]) -> int:
    if not v:
        raise ValueError("argmax of an empty vector")
    best = 0
    for i in range(1, len(v)):
        if v[i] > v[best]:
            best = i
    return best
