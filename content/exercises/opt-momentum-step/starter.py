def momentum_step(w: list[float], velocity: list[float], grad: list[float],
                  lr: float, beta: float) -> list[list[float]]:
    """One step of gradient descent with momentum:

        v_new = beta * velocity + grad
        w_new = w - lr * v_new

    Return [w_new, v_new] (a 2-row matrix).
    """
    # TODO
    raise NotImplementedError
