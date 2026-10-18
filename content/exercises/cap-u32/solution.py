def read_u32_be(data: bytes, offset: int) -> int:
    if offset + 4 > len(data):
        raise ValueError("not enough bytes")
    return (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
