def dense_forward(x: list[list[float]], w: list[list[float]], b: list[float]) -> list[list[float]]:
    return add_bias(matmul(x, transpose(w)), b)
