def dense_backward_weights(grad_out: list[list[float]], x: list[list[float]]) -> list[list[float]]:
    return matmul(transpose(grad_out), x)
