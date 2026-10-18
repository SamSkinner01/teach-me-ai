def idx_labels(data: bytes, limit: int) -> list[int]:
    dims = idx_dims(data)
    if len(dims) != 1:
        raise ValueError("a label file has 1 dimension")
    return list(data[8:8 + min(limit, dims[0])])
