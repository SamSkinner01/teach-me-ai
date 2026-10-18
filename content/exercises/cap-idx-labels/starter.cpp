#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Parse an IDX label file (1 dimension: count) into a list of labels, returning only the
// first min(limit, count).
//
// Signal an error if the file isn't valid or doesn't have exactly 1 dimension.
std::vector<std::size_t> idx_labels(const std::vector<std::uint8_t>& data, std::size_t limit) {
    // TODO
    throw std::logic_error("not implemented");
}
