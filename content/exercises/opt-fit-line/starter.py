def fit_line(xs: list[float], ys: list[float], lr: float, epochs: int) -> list[float]:
    """Fit y = w*x + b to the points by full-batch gradient descent on the
    mean squared error. Start from w = b = 0 and do `epochs` updates:

        pred = [w*x + b for x in xs]
        g = mse_grad(pred, ys)
        w -= lr * dot(g, xs);   b -= lr * vec_sum(g)

    Return [w, b]. Raise ValueError if xs and ys have different lengths.
    """
    # TODO
    raise NotImplementedError
