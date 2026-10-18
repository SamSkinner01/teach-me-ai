#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> im2col(const std::vector<std::vector<double>>& image, std::size_t k) {
    std::size_t h = image.size(), w = image.empty() ? 0 : image[0].size();
    if (k == 0 || k > h || k > w) throw std::invalid_argument("the patch must fit inside the image");
    std::vector<std::vector<double>> rows;
    for (std::size_t i = 0; i + k <= h; ++i)
        for (std::size_t j = 0; j + k <= w; ++j) {
            std::vector<double> row;
            row.reserve(k * k);
            for (std::size_t u = 0; u < k; ++u)
                for (std::size_t v = 0; v < k; ++v) row.push_back(image[i + u][j + v]);
            rows.push_back(row);
        }
    return rows;
}
