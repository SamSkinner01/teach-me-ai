def conv2d_multi(x: list[float], x_shape: list[int], w: list[float], w_shape: list[int],
                 b: list[float]) -> list[float]:
    c_in, h, wd = x_shape
    o_n, c_w, kh, kw = w_shape
    if len(x) != c_in * h * wd or len(w) != o_n * c_w * kh * kw or c_w != c_in or len(b) != o_n:
        raise ValueError("shapes don't match")
    if kh > h or kw > wd:
        raise ValueError("the kernel must fit inside the image")
    oh, ow = h - kh + 1, wd - kw + 1
    out = [0.0] * (o_n * oh * ow)
    for o in range(o_n):
        for i in range(oh):
            for j in range(ow):
                s = b[o]
                for c in range(c_in):
                    for u in range(kh):
                        for v in range(kw):
                            s += w[((o * c_in + c) * kh + u) * kw + v] * x[(c * h + i + u) * wd + j + v]
                out[(o * oh + i) * ow + j] = s
    return out
