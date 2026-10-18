#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> matmul(const std::vector<std::vector<double>>& a,
                                        const std::vector<std::vector<double>>& b) {
    std::size_t k = a.empty() ? 0 : a[0].size();
    if (k != b.size()) {
        throw std::invalid_argument("cannot multiply: a's columns must equal b's rows");
    }
    std::size_t m = b.empty() ? 0 : b[0].size();
    std::vector<std::vector<double>> out(a.size(), std::vector<double>(m, 0.0));
    for (std::size_t i = 0; i < a.size(); ++i) {
        for (std::size_t j = 0; j < m; ++j) {
            double total = 0.0;
            for (std::size_t t = 0; t < k; ++t) {
                total += a[i][t] * b[t][j];
            }
            out[i][j] = total;
        }
    }
    return out;
}
