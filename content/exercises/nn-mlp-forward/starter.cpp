#include <cstddef>
#include <stdexcept>
#include <vector>

// A two-layer perceptron: dense -> relu -> dense.
//
//     h = relu applied to every row of dense_forward(x, w1, b1)
//     logits = dense_forward(h, w2, b2)
//
// Return the logits (N x classes).
std::vector<std::vector<double>> mlp_forward(const std::vector<std::vector<double>>& x, const std::vector<std::vector<double>>& w1, const std::vector<double>& b1,
                                             const std::vector<std::vector<double>>& w2, const std::vector<double>& b2) {
    // TODO
    throw std::logic_error("not implemented");
}
