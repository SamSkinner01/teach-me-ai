def maxpool2d_backward(image: list[list[float]], grad_out: list[list[float]],
                       size: int) -> list[list[float]]:
    """Backprop through maxpool2d(image, size). grad_out is dL/d(output), shape (H//size) x (W//size).
Return dL/d(image), the same shape as image: each window's gradient goes entirely to the
position that held the window's maximum (the first one in row-major order if tied);
every other position gets 0.

Signal an error if grad_out has the wrong shape or size is 0.
    """
    # TODO
    raise NotImplementedError
