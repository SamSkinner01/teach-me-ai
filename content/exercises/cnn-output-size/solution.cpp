#include <cstddef>
#include <stdexcept>
#include <vector>

std::size_t conv_output_size(std::size_t n, std::size_t k, std::size_t stride, std::size_t padding) {
    if (stride == 0 || k > n + 2 * padding) throw std::invalid_argument("stride must be positive and the kernel must fit");
    return (n + 2 * padding - k) / stride + 1;
}
