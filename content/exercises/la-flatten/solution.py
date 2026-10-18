def flatten(m: list[list[float]]) -> list[float]:
    out = []
    for row in m:
        out.extend(row)
    return out
