#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

#include <algorithm>

std::vector<std::size_t> idx_labels(const std::vector<std::uint8_t>& data, std::size_t limit) {
    std::vector<std::size_t> dims = idx_dims(data);
    if (dims.size() != 1) throw std::invalid_argument("a label file has 1 dimension");
    std::size_t n = std::min(limit, dims[0]);
    return std::vector<std::size_t>(data.begin() + 8, data.begin() + 8 + n);
}
