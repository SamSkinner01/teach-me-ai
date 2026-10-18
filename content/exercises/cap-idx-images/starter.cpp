#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Parse an IDX image file (3 dimensions: count, rows, cols) into a matrix with one row per
// image: the rows*cols pixels in order, each converted from a byte to a float in [0, 1]
// (byte / 255). Return only the first min(limit, count) images.
//
// Signal an error if the file isn't valid or doesn't have exactly 3 dimensions.
// Tip: idx_dims is in your library.
std::vector<std::vector<double>> idx_images(const std::vector<std::uint8_t>& data, std::size_t limit) {
    // TODO
    throw std::logic_error("not implemented");
}
