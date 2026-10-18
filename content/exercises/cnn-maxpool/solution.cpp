#include <cstddef>
#include <stdexcept>
#include <vector>

#include <algorithm>

std::vector<std::vector<double>> maxpool2d(const std::vector<std::vector<double>>& image, std::size_t size) {
    if (size == 0) throw std::invalid_argument("size must be positive");
    std::size_t oh = image.size() / size, ow = (image.empty() ? 0 : image[0].size()) / size;
    std::vector<std::vector<double>> out(oh, std::vector<double>(ow, 0.0));
    for (std::size_t i = 0; i < oh; ++i)
        for (std::size_t j = 0; j < ow; ++j) {
            double best = image[i * size][j * size];
            for (std::size_t u = 0; u < size; ++u)
                for (std::size_t v = 0; v < size; ++v) best = std::max(best, image[i * size + u][j * size + v]);
            out[i][j] = best;
        }
    return out;
}
