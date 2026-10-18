def cnn_forward(image: list[float], image_shape: list[int], conv_w: list[float], conv_w_shape: list[int],
                conv_b: list[float], dense_w: list[list[float]], dense_b: list[float]) -> list[float]:
    z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b)
    a = relu(z)
    oh = image_shape[1] - conv_w_shape[2] + 1
    ow = image_shape[2] - conv_w_shape[3] + 1
    flat = []
    for o in range(conv_w_shape[0]):
        fmap = reshape(a[o * oh * ow:(o + 1) * oh * ow], oh, ow)
        flat.extend(flatten(maxpool2d(fmap, 2)))
    return vec_add(mat_vec(dense_w, flat), dense_b)
