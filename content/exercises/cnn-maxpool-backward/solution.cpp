#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> maxpool2d_backward(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& grad_out, std::size_t size) {
    if (size == 0) throw std::invalid_argument("size must be positive");
    std::size_t h = image.size(), w = image.empty() ? 0 : image[0].size();
    std::size_t oh = h / size, ow = w / size;
    if (grad_out.size() != oh) throw std::invalid_argument("grad_out has the wrong shape");
    for (const auto& r : grad_out)
        if (r.size() != ow) throw std::invalid_argument("grad_out has the wrong shape");
    std::vector<std::vector<double>> out(h, std::vector<double>(w, 0.0));
    for (std::size_t i = 0; i < oh; ++i)
        for (std::size_t j = 0; j < ow; ++j) {
            std::size_t bi = i * size, bj = j * size;
            for (std::size_t u = 0; u < size; ++u)
                for (std::size_t v = 0; v < size; ++v)
                    if (image[i * size + u][j * size + v] > image[bi][bj]) {
                        bi = i * size + u;
                        bj = j * size + v;
                    }
            out[bi][bj] += grad_out[i][j];
        }
    return out;
}
