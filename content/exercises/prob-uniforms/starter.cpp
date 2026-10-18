#include <cstddef>
#include <stdexcept>
#include <vector>

// Return n pseudo-random numbers in (0, 1) from the xorshift32 generator.
//
// state = seed; then n times: state = xorshift32(state) and output
// state / 2^32 (as a double).
//
// Throw std::invalid_argument unless 1 <= seed <= 2^32 - 1.
// Tip: `xorshift32` is in your library.
std::vector<double> random_uniforms(std::size_t seed, std::size_t n) {
    // TODO
    throw std::logic_error("not implemented");
}
