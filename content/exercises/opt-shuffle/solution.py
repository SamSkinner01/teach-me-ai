def shuffled_indices(seed: int, n: int) -> list[int]:
    if not 1 <= seed <= 0xFFFFFFFF:
        raise ValueError("seed must be between 1 and 2**32 - 1")
    idx = list(range(n))
    state = seed
    for i in range(n - 1, 0, -1):
        state = xorshift32(state)
        j = state % (i + 1)
        idx[i], idx[j] = idx[j], idx[i]
    return idx
