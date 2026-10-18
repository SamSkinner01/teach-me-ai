def conv2d(image: list[list[float]], kernel: list[list[float]]) -> list[list[float]]:
    h, w = len(image), len(image[0]) if image else 0
    kh, kw = len(kernel), len(kernel[0]) if kernel else 0
    if kh == 0 or kw == 0 or kh > h or kw > w:
        raise ValueError("the kernel must fit inside the image")
    out = []
    for i in range(h - kh + 1):
        row = []
        for j in range(w - kw + 1):
            s = 0.0
            for u in range(kh):
                for v in range(kw):
                    s += image[i + u][j + v] * kernel[u][v]
            row.append(s)
        out.append(row)
    return out
