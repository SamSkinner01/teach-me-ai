#include <cstddef>
#include <stdexcept>
#include <vector>

// A dense (fully connected) layer applied to a batch.
// x is N x in (one example per row), w is out x in (one neuron per row), b has `out` entries.
// Return x · wᵀ + b: an N x out matrix whose row i is the layer's output for example i.
//
// Tip: matmul, transpose and add_bias are in your library.
std::vector<std::vector<double>> dense_forward(const std::vector<std::vector<double>>& x, const std::vector<std::vector<double>>& w, const std::vector<double>& b) {
    // TODO
    throw std::logic_error("not implemented");
}
