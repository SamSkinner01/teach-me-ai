def add_bias(m: list[list[float]], b: list[float]) -> list[list[float]]:
    return [vec_add(row, b) for row in m]
