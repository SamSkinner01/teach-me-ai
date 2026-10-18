def reshape(v: list[float], rows: int, cols: int) -> list[list[float]]:
    if rows * cols != len(v):
        raise ValueError(f"cannot reshape {len(v)} elements into {rows}x{cols}")
    return [v[r * cols:(r + 1) * cols] for r in range(rows)]
