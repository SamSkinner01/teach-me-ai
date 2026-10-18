def relative_error(a: list[float], b: list[float]) -> float:
    diff = vec_add(a, vec_scale(b, -1.0))
    denom = norm(a) + norm(b)
    if denom == 0.0:
        return 0.0
    return norm(diff) / denom
