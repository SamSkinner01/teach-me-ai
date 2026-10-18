#include <cstddef>
#include <cstdint>

std::size_t xorshift32(std::size_t state) {
    std::uint32_t x = static_cast<std::uint32_t>(state);
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return x;
}
