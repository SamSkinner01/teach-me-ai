#include <stdexcept>
#include <vector>

// Add the vector b to every row of m (broadcasting).
//
// result[i][j] = m[i][j] + b[j]
//
// add_bias({{1, 2, 3}, {4, 5, 6}}, {10, 20, 30}) == {{11, 22, 33}, {14, 25, 36}}
//
// Throw std::invalid_argument if b.size() differs from the number of columns of m.
std::vector<std::vector<double>> add_bias(const std::vector<std::vector<double>>& m,
                                          const std::vector<double>& b) {
    // TODO
    throw std::logic_error("not implemented");
}
