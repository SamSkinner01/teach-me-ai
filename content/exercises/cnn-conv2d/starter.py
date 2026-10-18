def conv2d(image: list[list[float]], kernel: list[list[float]]) -> list[list[float]]:
    """Slide `kernel` over `image` and return the feature map ("valid" cross-correlation, stride 1,
no padding): out[i][j] = sum over u, v of image[i+u][j+v] * kernel[u][v].
An H x W image and a kh x kw kernel give an (H-kh+1) x (W-kw+1) output.

Signal an error if the kernel is larger than the image in either direction, or empty.
    """
    # TODO
    raise NotImplementedError
