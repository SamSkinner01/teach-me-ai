def mse_loss(pred: list[float], target: list[float]) -> float:
    if len(pred) != len(target) or not pred:
        raise ValueError("need one target per prediction")
    diff = vec_add(pred, vec_scale(target, -1.0))
    return dot(diff, diff) / len(pred)
