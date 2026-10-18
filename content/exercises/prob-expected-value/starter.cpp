#include <stdexcept>
#include <vector>

// Return the expected value of a discrete random variable that takes
// values[i] with probability probs[i].
//
// expected_value({0, 10}, {0.9, 0.1}) == 1.0
//
// Throw std::invalid_argument if the lengths differ, any probability is
// negative, or the probabilities don't sum to 1 (within 1e-9).
double expected_value(const std::vector<double>& values, const std::vector<double>& probs) {
    // TODO
    throw std::logic_error("not implemented");
}
