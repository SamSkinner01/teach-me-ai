#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> mlp_forward(const std::vector<std::vector<double>>& x, const std::vector<std::vector<double>>& w1, const std::vector<double>& b1,
                                             const std::vector<std::vector<double>>& w2, const std::vector<double>& b2) {
    std::vector<std::vector<double>> h = dense_forward(x, w1, b1);
    for (auto& row : h) row = relu(row);
    return dense_forward(h, w2, b2);
}
