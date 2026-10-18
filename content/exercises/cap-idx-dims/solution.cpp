#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<std::size_t> idx_dims(const std::vector<std::uint8_t>& data) {
    if (data.size() < 4 || data[0] != 0 || data[1] != 0 || data[2] != 8)
        throw std::invalid_argument("not an unsigned-byte IDX file");
    std::size_t nd = data[3];
    std::vector<std::size_t> dims;
    std::size_t total = 1;
    for (std::size_t i = 0; i < nd; ++i) {
        dims.push_back(read_u32_be(data, 4 + 4 * i));
        total *= dims.back();
    }
    if (data.size() != 4 + 4 * nd + total) throw std::invalid_argument("the file is truncated or has extra bytes");
    return dims;
}
