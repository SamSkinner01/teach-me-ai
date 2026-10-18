#include <cstddef>
#include <stdexcept>
#include <vector>

// Backprop through out = conv2d(image, kernel), for the kernel.
// grad_out is dL/d(out). Return dL/d(kernel), the kernel's shape:
//     dK[u][v] = sum over i, j of grad_out[i][j] * image[i+u][j+v]
//
// Look closely: that's conv2d(image, grad_out). Your conv2d is in your library.
std::vector<std::vector<double>> conv2d_backward_kernel(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& grad_out) {
    // TODO
    throw std::logic_error("not implemented");
}
