#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> dense_backward_weights(const std::vector<std::vector<double>>& grad_out, const std::vector<std::vector<double>>& x) {
    return matmul(transpose(grad_out), x);
}
