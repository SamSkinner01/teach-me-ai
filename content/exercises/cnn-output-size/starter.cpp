#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the size of a convolution's output along one axis:
//     (n + 2*padding - k) // stride + 1   (rounding down)
//
// conv_output_size(28, 3, 1, 0) == 26
//
// Signal an error if stride is 0 or the kernel doesn't fit (k > n + 2*padding).
std::size_t conv_output_size(std::size_t n, std::size_t k, std::size_t stride, std::size_t padding) {
    // TODO
    throw std::logic_error("not implemented");
}
