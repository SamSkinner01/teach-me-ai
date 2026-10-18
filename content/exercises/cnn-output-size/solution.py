def conv_output_size(n: int, k: int, stride: int, padding: int) -> int:
    if stride == 0 or k > n + 2 * padding:
        raise ValueError("stride must be positive and the kernel must fit")
    return (n + 2 * padding - k) // stride + 1
