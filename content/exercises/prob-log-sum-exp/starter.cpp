#include <cmath>
#include <stdexcept>
#include <vector>

// Return ln(Σ_i exp(v[i])), computed without overflow or underflow.
//
// log_sum_exp({0.0, 0.0}) == std::log(2.0)
// log_sum_exp({1000.0, 1000.0}) == 1000 + std::log(2.0)
//
// Throw std::invalid_argument if v is empty.
double log_sum_exp(const std::vector<double>& v) {
    // TODO
    throw std::logic_error("not implemented");
}
