#include <cstddef>
#include <stdexcept>
#include <vector>

// Backprop through z = x · wᵀ + b, for the input.
// grad_out is dL/dz (N x out) and w is out x in. Return dL/dx (N x in) = grad_out · w.
//
// Tip: matmul is in your library.
std::vector<std::vector<double>> dense_backward_input(const std::vector<std::vector<double>>& grad_out, const std::vector<std::vector<double>>& w) {
    // TODO
    throw std::logic_error("not implemented");
}
