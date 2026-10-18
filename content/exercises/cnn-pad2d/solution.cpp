#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> pad2d(const std::vector<std::vector<double>>& image, std::size_t p) {
    std::size_t h = image.size(), w = image.empty() ? 0 : image[0].size();
    std::vector<std::vector<double>> out(h + 2 * p, std::vector<double>(w + 2 * p, 0.0));
    for (std::size_t i = 0; i < h; ++i)
        for (std::size_t j = 0; j < w; ++j) out[i + p][j + p] = image[i][j];
    return out;
}
