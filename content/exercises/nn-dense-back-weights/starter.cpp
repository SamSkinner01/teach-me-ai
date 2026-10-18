#include <cstddef>
#include <stdexcept>
#include <vector>

// Backprop through z = x · wᵀ + b, for the weights.
// grad_out is dL/dz (N x out) and x is the layer's input (N x in).
// Return dL/dw (out x in, the same shape as w) = grad_outᵀ · x.
//
// Tip: matmul and transpose are in your library.
std::vector<std::vector<double>> dense_backward_weights(const std::vector<std::vector<double>>& grad_out, const std::vector<std::vector<double>>& x) {
    // TODO
    throw std::logic_error("not implemented");
}
