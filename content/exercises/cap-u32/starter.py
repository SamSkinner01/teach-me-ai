def read_u32_be(data: bytes, offset: int) -> int:
    """Read the 4 bytes data[offset .. offset+3] as one unsigned 32-bit integer, most significant
byte first ("big-endian"):  b0 * 2^24 + b1 * 2^16 + b2 * 2^8 + b3.

read_u32_be(bytes([0, 0, 8, 3]), 0) == 2051

Signal an error if there aren't 4 bytes available at offset.
    """
    # TODO
    raise NotImplementedError
