import math


def random_normals(seed: int, n: int) -> list[float]:
    pairs = (n + 1) // 2
    u = random_uniforms(seed, 2 * pairs)
    out = []
    for k in range(pairs):
        r = math.sqrt(-2.0 * math.log(u[2 * k]))
        theta = 2.0 * math.pi * u[2 * k + 1]
        out.append(r * math.cos(theta))
        out.append(r * math.sin(theta))
    return out[:n]
