def maxpool2d(image: list[list[float]], size: int) -> list[list[float]]:
    if size == 0:
        raise ValueError("size must be positive")
    oh, ow = len(image) // size, (len(image[0]) if image else 0) // size
    out = []
    for i in range(oh):
        row = []
        for j in range(ow):
            best = image[i * size][j * size]
            for u in range(size):
                for v in range(size):
                    best = max(best, image[i * size + u][j * size + v])
            row.append(best)
        out.append(row)
    return out
