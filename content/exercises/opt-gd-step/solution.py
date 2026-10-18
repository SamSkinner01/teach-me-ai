def gd_step(w: list[float], grad: list[float], lr: float) -> list[float]:
    return vec_add(w, vec_scale(grad, -lr))
