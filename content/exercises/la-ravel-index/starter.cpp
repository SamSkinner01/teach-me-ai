#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the position of `index` in the flat, row-major data of a tensor.
//
// ravel_index({1, 2}, {2, 3}) == 5     // row 1, column 2 of a 2×3 matrix
//
// Throw std::out_of_range (or std::invalid_argument) if index has the
// wrong number of entries or any entry is out of range for its axis.
//
// Tip: your `strides` function is available.
std::size_t ravel_index(const std::vector<std::size_t>& index, const std::vector<std::size_t>& shape) {
    // TODO
    throw std::logic_error("not implemented");
}
