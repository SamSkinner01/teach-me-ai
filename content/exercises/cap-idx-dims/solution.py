def idx_dims(data: bytes) -> list[int]:
    if len(data) < 4 or data[0] != 0 or data[1] != 0 or data[2] != 8:
        raise ValueError("not an unsigned-byte IDX file")
    nd = data[3]
    dims = [read_u32_be(data, 4 + 4 * i) for i in range(nd)]
    total = 1
    for n in dims:
        total *= n
    if len(data) != 4 + 4 * nd + total:
        raise ValueError("the file is truncated or has extra bytes")
    return dims
