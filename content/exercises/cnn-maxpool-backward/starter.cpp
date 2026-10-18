#include <cstddef>
#include <stdexcept>
#include <vector>

// Backprop through maxpool2d(image, size). grad_out is dL/d(output), shape (H//size) x (W//size).
// Return dL/d(image), the same shape as image: each window's gradient goes entirely to the
// position that held the window's maximum (the first one in row-major order if tied);
// every other position gets 0.
//
// Signal an error if grad_out has the wrong shape or size is 0.
std::vector<std::vector<double>> maxpool2d_backward(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& grad_out, std::size_t size) {
    // TODO
    throw std::logic_error("not implemented");
}
