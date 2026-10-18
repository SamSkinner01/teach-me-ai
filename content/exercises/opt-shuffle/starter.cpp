#include <cstddef>
#include <stdexcept>
#include <vector>

// Return a random permutation of {0, 1, ..., n-1} using the Fisher–Yates shuffle:
//
//     idx = {0, 1, ..., n-1}; state = seed
//     for i from n-1 down to 1:
//         state = xorshift32(state)
//         j = state % (i + 1)
//         swap idx[i] and idx[j]        (std::swap)
//
// Throw std::invalid_argument unless 1 <= seed <= 2^32 - 1.
std::vector<std::size_t> shuffled_indices(std::size_t seed, std::size_t n) {
    // TODO
    throw std::logic_error("not implemented");
}
