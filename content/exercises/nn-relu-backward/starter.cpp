#include <cstddef>
#include <stdexcept>
#include <vector>

// Backpropagate through relu. z is the input relu saw; grad_out is dL/d(relu(z)).
// Return dL/dz: grad_out[i] where z[i] > 0, and 0 where z[i] <= 0.
//
// relu_backward([-1.0, 2.0], [5.0, 5.0]) == [0.0, 5.0]
//
// Signal an error if the lengths differ.
std::vector<double> relu_backward(const std::vector<double>& z, const std::vector<double>& grad_out) {
    // TODO
    throw std::logic_error("not implemented");
}
