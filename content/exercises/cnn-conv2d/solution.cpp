#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> conv2d(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& kernel) {
    std::size_t h = image.size(), w = image.empty() ? 0 : image[0].size();
    std::size_t kh = kernel.size(), kw = kernel.empty() ? 0 : kernel[0].size();
    if (kh == 0 || kw == 0 || kh > h || kw > w) throw std::invalid_argument("the kernel must fit inside the image");
    std::vector<std::vector<double>> out(h - kh + 1, std::vector<double>(w - kw + 1, 0.0));
    for (std::size_t i = 0; i + kh <= h; ++i)
        for (std::size_t j = 0; j + kw <= w; ++j) {
            double s = 0.0;
            for (std::size_t u = 0; u < kh; ++u)
                for (std::size_t v = 0; v < kw; ++v) s += image[i + u][j + v] * kernel[u][v];
            out[i][j] = s;
        }
    return out;
}
