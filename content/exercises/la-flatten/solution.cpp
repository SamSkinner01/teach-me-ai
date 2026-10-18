#include <vector>

std::vector<double> flatten(const std::vector<std::vector<double>>& m) {
    std::vector<double> out;
    for (const auto& row : m) {
        out.insert(out.end(), row.begin(), row.end());
    }
    return out;
}
