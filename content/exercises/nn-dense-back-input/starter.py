def dense_backward_input(grad_out: list[list[float]], w: list[list[float]]) -> list[list[float]]:
    """Backprop through z = x · wᵀ + b, for the input.
grad_out is dL/dz (N x out) and w is out x in. Return dL/dx (N x in) = grad_out · w.

Tip: matmul is in your library.
    """
    # TODO
    raise NotImplementedError
