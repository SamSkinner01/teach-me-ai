#include <cstddef>
#include <stdexcept>
#include <vector>

// Backprop through z = x · wᵀ + b, for the bias.
// grad_out is dL/dz (N x out). Return dL/db (`out` entries): the sum of each column of grad_out.
//
// Signal an error if grad_out is empty.
std::vector<double> dense_backward_bias(const std::vector<std::vector<double>>& grad_out) {
    // TODO
    throw std::logic_error("not implemented");
}
