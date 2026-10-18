def dense_backward_input(grad_out: list[list[float]], w: list[list[float]]) -> list[list[float]]:
    return matmul(grad_out, w)
