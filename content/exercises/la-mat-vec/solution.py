def mat_vec(m: list[list[float]], v: list[float]) -> list[float]:
    return [dot(row, v) for row in m]
