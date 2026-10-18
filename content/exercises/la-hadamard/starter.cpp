#include <stdexcept>
#include <vector>

// Return the element-wise (Hadamard) product: result[i][j] = a[i][j] * b[i][j].
//
// hadamard({{1, 2}, {3, 4}}, {{5, 6}, {7, 8}}) == {{5, 12}, {21, 32}}
//
// Throw std::invalid_argument if a and b have different shapes.
std::vector<std::vector<double>> hadamard(const std::vector<std::vector<double>>& a,
                                          const std::vector<std::vector<double>>& b) {
    // TODO
    throw std::logic_error("not implemented");
}
