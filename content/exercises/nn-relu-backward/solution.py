def relu_backward(z: list[float], grad_out: list[float]) -> list[float]:
    if len(z) != len(grad_out):
        raise ValueError("need one gradient per input")
    return [g if x > 0 else 0.0 for x, g in zip(z, grad_out)]
