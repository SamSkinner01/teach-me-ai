def sgd_fit_line(xs: list[float], ys: list[float], lr: float, epochs: int,
                 batch_size: int, seed: int) -> list[float]:
    """Fit y = w*x + b with mini-batch stochastic gradient descent.

    Start from w = b = 0. For each epoch e = 0, 1, ...:
        order = shuffled_indices(seed + e, n)
        for each consecutive slice of `order` of length batch_size
        (the last slice may be shorter):
            pred = [w*xs[i] + b for i in batch];  g = mse_grad(pred, [ys[i] ...])
            w -= lr * dot(g, [xs[i] ...]);        b -= lr * vec_sum(g)

    Return [w, b]. Raise ValueError if xs and ys have different lengths.
    """
    # TODO
    raise NotImplementedError
