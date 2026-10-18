MASK32 = 0xFFFFFFFF


def xorshift32(state: int) -> int:
    x = state & MASK32
    x ^= (x << 13) & MASK32
    x ^= x >> 17
    x ^= (x << 5) & MASK32
    return x
