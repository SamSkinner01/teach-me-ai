def conv2d_backward_kernel(image: list[list[float]], grad_out: list[list[float]]) -> list[list[float]]:
    return conv2d(image, grad_out)
