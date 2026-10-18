def fit_line(xs: list[float], ys: list[float], lr: float, epochs: int) -> list[float]:
    if len(xs) != len(ys):
        raise ValueError("need one y per x")
    w, b = 0.0, 0.0
    for _ in range(epochs):
        pred = [w * x + b for x in xs]
        g = mse_grad(pred, ys)
        w, b = w - lr * dot(g, xs), b - lr * vec_sum(g)
    return [w, b]
