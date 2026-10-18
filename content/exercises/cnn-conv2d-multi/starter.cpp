#include <cstddef>
#include <stdexcept>
#include <vector>

// A multi-channel convolution layer on flat, row-major tensors.
// x has shape x_shape = [C, H, W]; w has shape w_shape = [O, C, KH, KW]; b has O entries.
// Return the output, shape [O, H-KH+1, W-KW+1], flattened row-major:
//     out[o, i, j] = b[o] + sum over c, u, v of w[o, c, u, v] * x[c, i+u, j+v]
//
// Signal an error if any length doesn't match its shape, the channel counts differ,
// or the kernel doesn't fit.
std::vector<double> conv2d_multi(const std::vector<double>& x, const std::vector<std::size_t>& x_shape, const std::vector<double>& w, const std::vector<std::size_t>& w_shape,
                                 const std::vector<double>& b) {
    // TODO
    throw std::logic_error("not implemented");
}
