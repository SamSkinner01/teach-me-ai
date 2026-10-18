def conv2d_im2col(image: list[list[float]], kernel: list[list[float]]) -> list[list[float]]:
    k = len(kernel)
    if any(len(row) != k for row in kernel):
        raise ValueError("the kernel must be square")
    flat = mat_vec(im2col(image, k), flatten(kernel))
    return reshape(flat, len(image) - k + 1, len(image[0]) - k + 1)
