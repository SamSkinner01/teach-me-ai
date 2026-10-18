#include <cstddef>
#include <stdexcept>
#include <vector>

// Convolution as a matrix product, for a square k x k kernel:
//     patches = im2col(image, k)                    (positions x k*k)
//     flat = patches · flatten(kernel)               (one value per position)
//     return flat reshaped to (H-k+1) x (W-k+1)
//
// It must give exactly the same answer as conv2d. im2col, mat_vec, flatten and reshape are in your library.
std::vector<std::vector<double>> conv2d_im2col(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& kernel) {
    // TODO
    throw std::logic_error("not implemented");
}
