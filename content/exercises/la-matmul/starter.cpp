#include <stdexcept>
#include <vector>

// Return the matrix product a · b.
//
// If a is n×k and b is k×m, the result is n×m and
// result[i][j] = sum over t of a[i][t] * b[t][j].
//
// matmul({{1, 2}, {3, 4}}, {{5, 6}, {7, 8}}) == {{19, 22}, {43, 50}}
//
// Throw std::invalid_argument if the number of columns of a differs
// from the number of rows of b.
std::vector<std::vector<double>> matmul(const std::vector<std::vector<double>>& a,
                                        const std::vector<std::vector<double>>& b) {
    // TODO
    throw std::logic_error("not implemented");
}
