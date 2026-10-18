def mlp_forward(x: list[list[float]], w1: list[list[float]], b1: list[float],
                w2: list[list[float]], b2: list[float]) -> list[list[float]]:
    h = [relu(row) for row in dense_forward(x, w1, b1)]
    return dense_forward(h, w2, b2)
