import math


def softmax(logits: list[float]) -> list[float]:
    m = max(logits)
    exps = [math.exp(z - m) for z in logits]
    return vec_scale(exps, 1.0 / vec_sum(exps))
