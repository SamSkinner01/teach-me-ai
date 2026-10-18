def conv2d_backward_input(grad_out: list[list[float]], kernel: list[list[float]]) -> list[list[float]]:
    """Backprop through out = conv2d(image, kernel), for the image. The kernel is square (k x k).
grad_out is dL/d(out), shape (H-k+1) x (W-k+1). Return dL/d(image), shape H x W:
    dX[a][b] = sum over i, j of grad_out[i][j] * kernel[a-i][b-j]   (where 0 <= a-i, b-j < k)

That's a "full" convolution: pad grad_out by k-1 on every side, then conv2d it with
the kernel rotated 180 degrees. pad2d and conv2d are in your library.
    """
    # TODO
    raise NotImplementedError
