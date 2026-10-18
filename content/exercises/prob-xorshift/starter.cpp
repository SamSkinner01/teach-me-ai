#include <cstddef>
#include <cstdint>
#include <stdexcept>

// Advance Marsaglia's xorshift32 generator by one step and return the new state.
//
//     x ^= x << 13
//     x ^= x >> 17
//     x ^= x << 5
//
// All arithmetic is on 32-bit unsigned integers, so bits shifted past
// bit 31 are discarded. Work in std::uint32_t:
//     std::uint32_t x = static_cast<std::uint32_t>(state);
//
// xorshift32(1) == 270369
std::size_t xorshift32(std::size_t state) {
    // TODO
    throw std::logic_error("not implemented");
}
