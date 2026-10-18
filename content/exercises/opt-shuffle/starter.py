def shuffled_indices(seed: int, n: int) -> list[int]:
    """Return a random permutation of [0, 1, ..., n-1] using the Fisher-Yates shuffle:

        idx = [0, 1, ..., n-1]; state = seed
        for i from n-1 down to 1:
            state = xorshift32(state)
            j = state % (i + 1)
            swap idx[i] and idx[j]

    Raise ValueError unless 1 <= seed <= 2**32 - 1.
    """
    # TODO
    raise NotImplementedError
