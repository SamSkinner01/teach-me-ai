#include <cstddef>
#include <vector>

std::vector<std::vector<double>> identity(std::size_t n) {
    std::vector<std::vector<double>> m(n, std::vector<double>(n, 0.0));
    for (std::size_t i = 0; i < n; ++i) {
        m[i][i] = 1.0;
    }
    return m;
}
