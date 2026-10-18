def conv2d_strided(image: list[list[float]], kernel: list[list[float]], stride: int,
                   padding: int) -> list[list[float]]:
    kh, kw = len(kernel), len(kernel[0])
    oh = conv_output_size(len(image), kh, stride, padding)
    ow = conv_output_size(len(image[0]), kw, stride, padding)
    padded = pad2d(image, padding)
    out = [[0.0] * ow for _ in range(oh)]
    for i in range(oh):
        for j in range(ow):
            s = 0.0
            for u in range(kh):
                for v in range(kw):
                    s += padded[i * stride + u][j * stride + v] * kernel[u][v]
            out[i][j] = s
    return out
