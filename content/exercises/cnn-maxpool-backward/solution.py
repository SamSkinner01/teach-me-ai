def maxpool2d_backward(image: list[list[float]], grad_out: list[list[float]],
                       size: int) -> list[list[float]]:
    if size == 0:
        raise ValueError("size must be positive")
    h, w = len(image), len(image[0]) if image else 0
    oh, ow = h // size, w // size
    if len(grad_out) != oh or any(len(r) != ow for r in grad_out):
        raise ValueError("grad_out has the wrong shape")
    out = [[0.0] * w for _ in range(h)]
    for i in range(oh):
        for j in range(ow):
            bi, bj = i * size, j * size
            for u in range(size):
                for v in range(size):
                    if image[i * size + u][j * size + v] > image[bi][bj]:
                        bi, bj = i * size + u, j * size + v
            out[bi][bj] += grad_out[i][j]
    return out
