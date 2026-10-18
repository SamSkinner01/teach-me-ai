#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> reshape(const std::vector<double>& v, std::size_t rows, std::size_t cols) {
    if (rows * cols != v.size()) {
        throw std::invalid_argument("rows * cols must equal the number of elements");
    }
    std::vector<std::vector<double>> out(rows);
    for (std::size_t r = 0; r < rows; ++r) {
        out[r].assign(v.begin() + r * cols, v.begin() + (r + 1) * cols);
    }
    return out;
}
