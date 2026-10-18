#include <stdexcept>
#include <vector>

double dot(const std::vector<double>& a, const std::vector<double>& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("dot product needs vectors of the same length");
    }
    double total = 0.0;
    for (std::size_t i = 0; i < a.size(); ++i) {
        total += a[i] * b[i];
    }
    return total;
}
