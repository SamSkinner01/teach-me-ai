def conv2d_strided(image: list[list[float]], kernel: list[list[float]], stride: int,
                   padding: int) -> list[list[float]]:
    """Convolution with stride and zero padding: pad the image by `padding`, then
out[i][j] = sum over u, v of padded[i*stride + u][j*stride + v] * kernel[u][v].
The output size on each axis is conv_output_size(n, k, stride, padding).

Tip: pad2d and conv_output_size are in your library.
    """
    # TODO
    raise NotImplementedError
