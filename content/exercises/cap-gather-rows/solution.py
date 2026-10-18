def gather_rows(m: list[list[float]], idx: list[int]) -> list[list[float]]:
    for i in idx:
        if not 0 <= i < len(m):
            raise IndexError(f"row {i} is out of range")
    return [list(m[i]) for i in idx]
