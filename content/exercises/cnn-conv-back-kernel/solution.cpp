#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> conv2d_backward_kernel(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& grad_out) {
    return conv2d(image, grad_out);
}
