def pad2d(image: list[list[float]], p: int) -> list[list[float]]:
    h, w = len(image), len(image[0]) if image else 0
    out = [[0.0] * (w + 2 * p) for _ in range(h + 2 * p)]
    for i in range(h):
        for j in range(w):
            out[i + p][j + p] = image[i][j]
    return out
