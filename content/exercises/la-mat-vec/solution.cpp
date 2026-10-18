#include <vector>

std::vector<double> mat_vec(const std::vector<std::vector<double>>& m, const std::vector<double>& v) {
    std::vector<double> out;
    out.reserve(m.size());
    for (const auto& row : m) {
        out.push_back(dot(row, v));
    }
    return out;
}
