def random_uniforms(seed: int, n: int) -> list[float]:
    """Return n pseudo-random numbers in (0, 1) from the xorshift32 generator.

    state = seed; then n times: state = xorshift32(state) and output
    state / 2**32.

    Raise ValueError unless 1 <= seed <= 2**32 - 1.
    Tip: `xorshift32` is in your library.
    """
    # TODO
    raise NotImplementedError
