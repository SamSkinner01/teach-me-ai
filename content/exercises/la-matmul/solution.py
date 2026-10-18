def matmul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    k = len(a[0]) if a else 0
    if k != len(b):
        raise ValueError(f"cannot multiply: a has {k} columns but b has {len(b)} rows")
    m = len(b[0]) if b else 0
    out = []
    for i in range(len(a)):
        row = []
        for j in range(m):
            total = 0.0
            for t in range(k):
                total += a[i][t] * b[t][j]
            row.append(total)
        out.append(row)
    return out
