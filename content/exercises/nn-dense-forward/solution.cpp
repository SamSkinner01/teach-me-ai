#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> dense_forward(const std::vector<std::vector<double>>& x, const std::vector<std::vector<double>>& w, const std::vector<double>& b) {
    return add_bias(matmul(x, transpose(w)), b);
}
