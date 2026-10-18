#include <cstddef>
#include <stdexcept>
#include <vector>

std::size_t ravel_index(const std::vector<std::size_t>& index, const std::vector<std::size_t>& shape) {
    if (index.size() != shape.size()) {
        throw std::invalid_argument("index must have one entry per axis");
    }
    for (std::size_t i = 0; i < shape.size(); ++i) {
        if (index[i] >= shape[i]) {
            throw std::out_of_range("index out of range");
        }
    }
    std::vector<std::size_t> s = strides(shape);
    std::size_t flat = 0;
    for (std::size_t i = 0; i < index.size(); ++i) {
        flat += index[i] * s[i];
    }
    return flat;
}
