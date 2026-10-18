def conv2d_im2col(image: list[list[float]], kernel: list[list[float]]) -> list[list[float]]:
    """Convolution as a matrix product, for a square k x k kernel:
    patches = im2col(image, k)                    (positions x k*k)
    flat = patches · flatten(kernel)               (one value per position)
    return flat reshaped to (H-k+1) x (W-k+1)

It must give exactly the same answer as conv2d. im2col, mat_vec, flatten and reshape are in your library.
    """
    # TODO
    raise NotImplementedError
