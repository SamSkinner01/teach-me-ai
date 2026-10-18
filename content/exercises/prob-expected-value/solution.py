def expected_value(values: list[float], probs: list[float]) -> float:
    if len(values) != len(probs):
        raise ValueError("need exactly one probability per value")
    if any(p < 0 for p in probs):
        raise ValueError("probabilities can't be negative")
    if abs(vec_sum(probs) - 1.0) > 1e-9:
        raise ValueError("probabilities must sum to 1")
    return dot(values, probs)
