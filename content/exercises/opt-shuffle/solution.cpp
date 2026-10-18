#include <cstddef>
#include <stdexcept>
#include <utility>
#include <vector>

std::vector<std::size_t> shuffled_indices(std::size_t seed, std::size_t n) {
    if (seed < 1 || seed > 0xFFFFFFFFull) {
        throw std::invalid_argument("seed must be between 1 and 2^32 - 1");
    }
    std::vector<std::size_t> idx(n);
    for (std::size_t i = 0; i < n; ++i) idx[i] = i;
    std::size_t state = seed;
    for (std::size_t i = n; i-- > 1;) {
        state = xorshift32(state);
        std::size_t j = state % (i + 1);
        std::swap(idx[i], idx[j]);
    }
    return idx;
}
