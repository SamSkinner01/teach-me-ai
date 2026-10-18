#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> conv2d_backward_input(const std::vector<std::vector<double>>& grad_out, const std::vector<std::vector<double>>& kernel) {
    std::size_t k = kernel.size();
    for (const auto& r : kernel)
        if (r.size() != k) throw std::invalid_argument("the kernel must be square");
    std::vector<std::vector<double>> flipped(k, std::vector<double>(k));
    for (std::size_t u = 0; u < k; ++u)
        for (std::size_t v = 0; v < k; ++v) flipped[u][v] = kernel[k - 1 - u][k - 1 - v];
    return conv2d(pad2d(grad_out, k - 1), flipped);
}
