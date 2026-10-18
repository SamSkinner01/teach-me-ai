def sgd_fit_line(xs: list[float], ys: list[float], lr: float, epochs: int,
                 batch_size: int, seed: int) -> list[float]:
    if len(xs) != len(ys):
        raise ValueError("need one y per x")
    n = len(xs)
    w, b = 0.0, 0.0
    for e in range(epochs):
        order = shuffled_indices(seed + e, n)
        for start in range(0, n, batch_size):
            batch = order[start:start + batch_size]
            bx = [xs[i] for i in batch]
            by = [ys[i] for i in batch]
            g = mse_grad([w * x + b for x in bx], by)
            w, b = w - lr * dot(g, bx), b - lr * vec_sum(g)
    return [w, b]
