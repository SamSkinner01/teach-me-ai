import math


def log_sum_exp(v: list[float]) -> float:
    if not v:
        raise ValueError("log_sum_exp of an empty vector")
    m = max(v)
    total = 0.0
    for x in v:
        total += math.exp(x - m)
    return m + math.log(total)
