#include <stdexcept>
#include <vector>

// Return the gradient of mse_loss(pred, target) with respect to each prediction:
// (2/n) · (pred[i] − target[i]).
//
// mse_grad({2.0, 4.0}, {1.0, 2.0}) == {1.0, 2.0}
//
// Throw std::invalid_argument if the lengths differ (or are zero).
std::vector<double> mse_grad(const std::vector<double>& pred, const std::vector<double>& target) {
    // TODO
    throw std::logic_error("not implemented");
}
