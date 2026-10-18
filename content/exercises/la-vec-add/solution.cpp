#include <stdexcept>
#include <vector>

std::vector<double> vec_add(const std::vector<double>& a, const std::vector<double>& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("cannot add vectors of different lengths");
    }
    std::vector<double> out(a.size());
    for (std::size_t i = 0; i < a.size(); ++i) {
        out[i] = a[i] + b[i];
    }
    return out;
}
