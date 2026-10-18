#include <cstddef>
#include <stdexcept>
#include <vector>

// Convolution with stride and zero padding: pad the image by `padding`, then
// out[i][j] = sum over u, v of padded[i*stride + u][j*stride + v] * kernel[u][v].
// The output size on each axis is conv_output_size(n, k, stride, padding).
//
// Tip: pad2d and conv_output_size are in your library.
std::vector<std::vector<double>> conv2d_strided(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& kernel, std::size_t stride, std::size_t padding) {
    // TODO
    throw std::logic_error("not implemented");
}
