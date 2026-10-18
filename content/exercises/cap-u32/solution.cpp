#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::size_t read_u32_be(const std::vector<std::uint8_t>& data, std::size_t offset) {
    if (offset + 4 > data.size()) throw std::invalid_argument("not enough bytes");
    return (static_cast<std::size_t>(data[offset]) << 24) | (static_cast<std::size_t>(data[offset + 1]) << 16) |
           (static_cast<std::size_t>(data[offset + 2]) << 8) | static_cast<std::size_t>(data[offset + 3]);
}
