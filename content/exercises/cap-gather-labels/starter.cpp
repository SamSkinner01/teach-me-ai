#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Return the labels selected by idx, in that order: [labels[idx[0]], labels[idx[1]], ...].
//
// Signal an error if any index is out of range.
std::vector<std::size_t> gather_labels(const std::vector<std::size_t>& labels, const std::vector<std::size_t>& idx) {
    // TODO
    throw std::logic_error("not implemented");
}
