#include <vector>

std::vector<std::vector<double>> add_bias(const std::vector<std::vector<double>>& m,
                                          const std::vector<double>& b) {
    std::vector<std::vector<double>> out;
    out.reserve(m.size());
    for (const auto& row : m) {
        out.push_back(vec_add(row, b));
    }
    return out;
}
