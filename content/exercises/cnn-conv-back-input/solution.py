def conv2d_backward_input(grad_out: list[list[float]], kernel: list[list[float]]) -> list[list[float]]:
    k = len(kernel)
    if any(len(row) != k for row in kernel):
        raise ValueError("the kernel must be square")
    flipped = [list(reversed(row)) for row in reversed(kernel)]
    return conv2d(pad2d(grad_out, k - 1), flipped)
