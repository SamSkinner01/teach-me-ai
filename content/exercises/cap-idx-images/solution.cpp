#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

#include <algorithm>

std::vector<std::vector<double>> idx_images(const std::vector<std::uint8_t>& data, std::size_t limit) {
    std::vector<std::size_t> dims = idx_dims(data);
    if (dims.size() != 3) throw std::invalid_argument("an image file has 3 dimensions");
    std::size_t size = dims[1] * dims[2];
    std::size_t n = std::min(limit, dims[0]);
    std::vector<std::vector<double>> out(n, std::vector<double>(size));
    for (std::size_t i = 0; i < n; ++i)
        for (std::size_t p = 0; p < size; ++p) out[i][p] = data[16 + i * size + p] / 255.0;
    return out;
}
