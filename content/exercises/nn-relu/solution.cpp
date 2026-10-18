#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> relu(const std::vector<double>& v) {
    std::vector<double> out;
    out.reserve(v.size());
    for (double x : v) out.push_back(x > 0.0 ? x : 0.0);
    return out;
}
