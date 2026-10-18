#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> dense_backward_bias(const std::vector<std::vector<double>>& grad_out) {
    if (grad_out.empty()) throw std::invalid_argument("empty batch");
    std::vector<double> total(grad_out[0].size(), 0.0);
    for (const auto& row : grad_out) total = vec_add(total, row);
    return total;
}
