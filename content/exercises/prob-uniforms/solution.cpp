#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> random_uniforms(std::size_t seed, std::size_t n) {
    if (seed < 1 || seed > 0xFFFFFFFFull) {
        throw std::invalid_argument("seed must be between 1 and 2^32 - 1");
    }
    std::vector<double> out;
    out.reserve(n);
    std::size_t state = seed;
    for (std::size_t i = 0; i < n; ++i) {
        state = xorshift32(state);
        out.push_back(static_cast<double>(state) / 4294967296.0);
    }
    return out;
}
