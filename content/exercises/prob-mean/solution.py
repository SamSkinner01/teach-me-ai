def mean(v: list[float]) -> float:
    if len(v) == 0:
        raise ValueError("the mean of an empty vector is undefined")
    return vec_sum(v) / len(v)
