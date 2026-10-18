#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Return the rows of m selected by idx, in that order: [m[idx[0]], m[idx[1]], ...].
// This is how a mini-batch is pulled out of the dataset.
//
// Signal an error if any index is out of range.
std::vector<std::vector<double>> gather_rows(const std::vector<std::vector<double>>& m, const std::vector<std::size_t>& idx) {
    // TODO
    throw std::logic_error("not implemented");
}
