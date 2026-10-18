#include <cmath>
#include <stdexcept>
#include <vector>

double log_sum_exp(const std::vector<double>& v) {
    if (v.empty()) {
        throw std::invalid_argument("log_sum_exp of an empty vector");
    }
    double m = v[0];
    for (double x : v) {
        if (x > m) m = x;
    }
    double total = 0.0;
    for (double x : v) {
        total += std::exp(x - m);
    }
    return m + std::log(total);
}
