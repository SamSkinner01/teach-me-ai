def transpose(m: list[list[float]]) -> list[list[float]]:
    if not m:
        return []
    rows, cols = len(m), len(m[0])
    return [[m[i][j] for i in range(rows)] for j in range(cols)]
