import math


def he_init(seed: int, fan_in: int, fan_out: int) -> list[list[float]]:
    z = random_normals(seed, fan_in * fan_out)
    scale = math.sqrt(2.0 / fan_in)
    return reshape(vec_scale(z, scale), fan_out, fan_in)
