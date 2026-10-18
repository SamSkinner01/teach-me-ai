def xorshift32(state: int) -> int:
    """Advance Marsaglia's xorshift32 generator by one step and return the new state.

        x ^= x << 13
        x ^= x >> 17
        x ^= x << 5

    All arithmetic is on 32-bit unsigned integers, so bits shifted past
    bit 31 are discarded (Python ints never overflow, so mask them off
    with & 0xFFFFFFFF).

    xorshift32(1) == 270369
    """
    # TODO
    raise NotImplementedError
