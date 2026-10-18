#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> dense_backward_input(const std::vector<std::vector<double>>& grad_out, const std::vector<std::vector<double>>& w) {
    return matmul(grad_out, w);
}
