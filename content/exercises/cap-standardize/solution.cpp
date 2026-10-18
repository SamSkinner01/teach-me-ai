#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> standardize(const std::vector<std::vector<double>>& images, double mean, double std_dev) {
    if (std_dev <= 0) throw std::invalid_argument("std must be positive");
    std::vector<std::vector<double>> out = images;
    for (auto& row : out)
        for (auto& x : row) x = (x - mean) / std_dev;
    return out;
}
