def idx_images(data: bytes, limit: int) -> list[list[float]]:
    dims = idx_dims(data)
    if len(dims) != 3:
        raise ValueError("an image file has 3 dimensions")
    count, rows, cols = dims
    size = rows * cols
    out = []
    for i in range(min(limit, count)):
        start = 16 + i * size
        out.append([b / 255.0 for b in data[start:start + size]])
    return out
