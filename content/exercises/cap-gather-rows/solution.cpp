#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> gather_rows(const std::vector<std::vector<double>>& m, const std::vector<std::size_t>& idx) {
    std::vector<std::vector<double>> out;
    out.reserve(idx.size());
    for (std::size_t i : idx) out.push_back(m.at(i));
    return out;
}
