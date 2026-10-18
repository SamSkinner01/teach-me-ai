def mlp_forward(x: list[list[float]], w1: list[list[float]], b1: list[float],
                w2: list[list[float]], b2: list[float]) -> list[list[float]]:
    """A two-layer perceptron: dense -> relu -> dense.

    h = relu applied to every row of dense_forward(x, w1, b1)
    logits = dense_forward(h, w2, b2)

Return the logits (N x classes).
    """
    # TODO
    raise NotImplementedError
