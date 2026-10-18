#include <vector>

std::vector<std::vector<double>> transpose(const std::vector<std::vector<double>>& m) {
    if (m.empty()) {
        return {};
    }
    std::size_t rows = m.size(), cols = m[0].size();
    std::vector<std::vector<double>> out(cols, std::vector<double>(rows));
    for (std::size_t i = 0; i < rows; ++i) {
        for (std::size_t j = 0; j < cols; ++j) {
            out[j][i] = m[i][j];
        }
    }
    return out;
}
