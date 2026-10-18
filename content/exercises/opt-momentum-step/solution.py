def momentum_step(w: list[float], velocity: list[float], grad: list[float],
                  lr: float, beta: float) -> list[list[float]]:
    v_new = vec_add(vec_scale(velocity, beta), grad)
    w_new = vec_add(w, vec_scale(v_new, -lr))
    return [w_new, v_new]
