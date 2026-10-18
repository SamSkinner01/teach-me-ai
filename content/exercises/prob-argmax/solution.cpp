#include <cstddef>
#include <stdexcept>
#include <vector>

std::size_t argmax(const std::vector<double>& v) {
    if (v.empty()) {
        throw std::invalid_argument("argmax of an empty vector");
    }
    std::size_t best = 0;
    for (std::size_t i = 1; i < v.size(); ++i) {
        if (v[i] > v[best]) best = i;
    }
    return best;
}
