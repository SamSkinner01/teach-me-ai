#include <cmath>
#include <stdexcept>
#include <vector>

double expected_value(const std::vector<double>& values, const std::vector<double>& probs) {
    if (values.size() != probs.size()) {
        throw std::invalid_argument("need exactly one probability per value");
    }
    for (double p : probs) {
        if (p < 0.0) {
            throw std::invalid_argument("probabilities can't be negative");
        }
    }
    if (std::fabs(vec_sum(probs) - 1.0) > 1e-9) {
        throw std::invalid_argument("probabilities must sum to 1");
    }
    return dot(values, probs);
}
