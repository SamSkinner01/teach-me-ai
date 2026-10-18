import math


def he_init(seed: int, fan_in: int, fan_out: int) -> list[list[float]]:
    """Return a fan_out x fan_in weight matrix with He initialization:
    standard normals (from random_normals(seed, fan_out * fan_in), filled
    row by row) scaled by sqrt(2 / fan_in).

    Tip: `random_normals`, `vec_scale` and `reshape` are in your library.
    """
    # TODO
    raise NotImplementedError
