def im2col(image: list[list[float]], k: int) -> list[list[float]]:
    h, w = len(image), len(image[0]) if image else 0
    if k == 0 or k > h or k > w:
        raise ValueError("the patch must fit inside the image")
    rows = []
    for i in range(h - k + 1):
        for j in range(w - k + 1):
            rows.append([image[i + u][j + v] for u in range(k) for v in range(k)])
    return rows
