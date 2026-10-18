def random_uniforms(seed: int, n: int) -> list[float]:
    if not 1 <= seed <= 0xFFFFFFFF:
        raise ValueError("seed must be between 1 and 2**32 - 1")
    out = []
    state = seed
    for _ in range(n):
        state = xorshift32(state)
        out.append(state / 4294967296.0)
    return out
