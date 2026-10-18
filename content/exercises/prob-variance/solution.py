def variance(v: list[float]) -> float:
    m = mean(v)
    total = 0.0
    for x in v:
        total += (x - m) ** 2
    return total / len(v)
