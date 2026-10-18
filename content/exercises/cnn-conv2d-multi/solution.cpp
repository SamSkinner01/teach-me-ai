#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> conv2d_multi(const std::vector<double>& x, const std::vector<std::size_t>& x_shape, const std::vector<double>& w, const std::vector<std::size_t>& w_shape,
                                 const std::vector<double>& b) {
    std::size_t c_in = x_shape[0], h = x_shape[1], wd = x_shape[2];
    std::size_t o_n = w_shape[0], c_w = w_shape[1], kh = w_shape[2], kw = w_shape[3];
    if (x.size() != c_in * h * wd || w.size() != o_n * c_w * kh * kw || c_w != c_in || b.size() != o_n)
        throw std::invalid_argument("shapes don't match");
    if (kh > h || kw > wd) throw std::invalid_argument("the kernel must fit inside the image");
    std::size_t oh = h - kh + 1, ow = wd - kw + 1;
    std::vector<double> out(o_n * oh * ow, 0.0);
    for (std::size_t o = 0; o < o_n; ++o)
        for (std::size_t i = 0; i < oh; ++i)
            for (std::size_t j = 0; j < ow; ++j) {
                double s = b[o];
                for (std::size_t c = 0; c < c_in; ++c)
                    for (std::size_t u = 0; u < kh; ++u)
                        for (std::size_t v = 0; v < kw; ++v)
                            s += w[((o * c_in + c) * kh + u) * kw + v] * x[(c * h + i + u) * wd + j + v];
                out[(o * oh + i) * ow + j] = s;
            }
    return out;
}
