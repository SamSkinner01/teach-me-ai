#include <cstddef>
#include <stdexcept>
#include <vector>

// Max pooling: split the image into non-overlapping size x size windows (stride = size)
// and keep the largest value in each. Leftover rows/columns that don't fill a whole
// window are dropped, so the output is (H // size) x (W // size).
//
// Signal an error if size is 0.
std::vector<std::vector<double>> maxpool2d(const std::vector<std::vector<double>>& image, std::size_t size) {
    // TODO
    throw std::logic_error("not implemented");
}
