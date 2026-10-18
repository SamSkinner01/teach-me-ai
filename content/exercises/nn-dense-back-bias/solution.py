def dense_backward_bias(grad_out: list[list[float]]) -> list[float]:
    if not grad_out:
        raise ValueError("empty batch")
    total = [0.0] * len(grad_out[0])
    for row in grad_out:
        total = vec_add(total, row)
    return total
