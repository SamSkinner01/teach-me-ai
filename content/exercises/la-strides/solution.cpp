#include <cstddef>
#include <vector>

std::vector<std::size_t> strides(const std::vector<std::size_t>& shape) {
    std::vector<std::size_t> result(shape.size());
    std::size_t step = 1;
    for (std::size_t i = shape.size(); i-- > 0;) {
        result[i] = step;
        step *= shape[i];
    }
    return result;
}
