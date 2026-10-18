#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<std::size_t> gather_labels(const std::vector<std::size_t>& labels, const std::vector<std::size_t>& idx) {
    std::vector<std::size_t> out;
    for (std::size_t i : idx) out.push_back(labels.at(i));
    return out;
}
