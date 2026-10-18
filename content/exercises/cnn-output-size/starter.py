def conv_output_size(n: int, k: int, stride: int, padding: int) -> int:
    """Return the size of a convolution's output along one axis:
    (n + 2*padding - k) // stride + 1   (rounding down)

conv_output_size(28, 3, 1, 0) == 26

Signal an error if stride is 0 or the kernel doesn't fit (k > n + 2*padding).
    """
    # TODO
    raise NotImplementedError
