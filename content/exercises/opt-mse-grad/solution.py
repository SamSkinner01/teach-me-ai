def mse_grad(pred: list[float], target: list[float]) -> list[float]:
    if len(pred) != len(target) or not pred:
        raise ValueError("need one target per prediction")
    return vec_scale(vec_add(pred, vec_scale(target, -1.0)), 2.0 / len(pred))
