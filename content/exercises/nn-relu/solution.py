def relu(v: list[float]) -> list[float]:
    return [x if x > 0 else 0.0 for x in v]
