def cnn_gradients(image: list[float], image_shape: list[int], label: int, conv_w: list[float],
                  conv_w_shape: list[int], conv_b: list[float], dense_w: list[list[float]],
                  dense_b: list[float]) -> list[float]:
    c_in, h, w = image_shape
    o_n, _, kh, kw = conv_w_shape
    oh, ow = h - kh + 1, w - kw + 1
    z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b)
    a = relu(z)
    maps = [reshape(a[o * oh * ow:(o + 1) * oh * ow], oh, ow) for o in range(o_n)]
    pooled = [maxpool2d(m, 2) for m in maps]
    ph, pw = oh // 2, ow // 2
    flat = [v for p in pooled for v in flatten(p)]
    logits = vec_add(mat_vec(dense_w, flat), dense_b)

    g = cross_entropy_grad(logits, label)
    d_dense_w = [vec_scale(flat, gk) for gk in g]
    d_flat = mat_vec(transpose(dense_w), g)
    channels = [reshape(image[c * h * w:(c + 1) * h * w], h, w) for c in range(c_in)]
    d_conv_w = [0.0] * len(conv_w)
    d_conv_b = [0.0] * o_n
    for o in range(o_n):
        d_pool = reshape(d_flat[o * ph * pw:(o + 1) * ph * pw], ph, pw)
        d_a = maxpool2d_backward(maps[o], d_pool, 2)
        d_z = reshape(relu_backward(z[o * oh * ow:(o + 1) * oh * ow], flatten(d_a)), oh, ow)
        d_conv_b[o] = vec_sum(flatten(d_z))
        for c in range(c_in):
            dk = conv2d_backward_kernel(channels[c], d_z)
            for u in range(kh):
                for v in range(kw):
                    d_conv_w[((o * c_in + c) * kh + u) * kw + v] = dk[u][v]
    return d_conv_w + d_conv_b + flatten(d_dense_w) + g
