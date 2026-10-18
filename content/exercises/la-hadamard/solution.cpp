#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> hadamard(const std::vector<std::vector<double>>& a,
                                          const std::vector<std::vector<double>>& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("hadamard product needs matrices of the same shape");
    }
    std::vector<std::vector<double>> out(a.size());
    for (std::size_t i = 0; i < a.size(); ++i) {
        if (a[i].size() != b[i].size()) {
            throw std::invalid_argument("hadamard product needs matrices of the same shape");
        }
        out[i].resize(a[i].size());
        for (std::size_t j = 0; j < a[i].size(); ++j) {
            out[i][j] = a[i][j] * b[i][j];
        }
    }
    return out;
}
