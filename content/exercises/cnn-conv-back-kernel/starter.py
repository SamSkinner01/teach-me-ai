def conv2d_backward_kernel(image: list[list[float]], grad_out: list[list[float]]) -> list[list[float]]:
    """Backprop through out = conv2d(image, kernel), for the kernel.
grad_out is dL/d(out). Return dL/d(kernel), the kernel's shape:
    dK[u][v] = sum over i, j of grad_out[i][j] * image[i+u][j+v]

Look closely: that's conv2d(image, grad_out). Your conv2d is in your library.
    """
    # TODO
    raise NotImplementedError
