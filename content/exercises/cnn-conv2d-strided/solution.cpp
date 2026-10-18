#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> conv2d_strided(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& kernel, std::size_t stride, std::size_t padding) {
    std::size_t kh = kernel.size(), kw = kernel[0].size();
    std::size_t oh = conv_output_size(image.size(), kh, stride, padding);
    std::size_t ow = conv_output_size(image[0].size(), kw, stride, padding);
    std::vector<std::vector<double>> padded = pad2d(image, padding);
    std::vector<std::vector<double>> out(oh, std::vector<double>(ow, 0.0));
    for (std::size_t i = 0; i < oh; ++i)
        for (std::size_t j = 0; j < ow; ++j) {
            double s = 0.0;
            for (std::size_t u = 0; u < kh; ++u)
                for (std::size_t v = 0; v < kw; ++v) s += padded[i * stride + u][j * stride + v] * kernel[u][v];
            out[i][j] = s;
        }
    return out;
}
