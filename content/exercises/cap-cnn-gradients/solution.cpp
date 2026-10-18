#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<double> cnn_gradients(const std::vector<double>& image, const std::vector<std::size_t>& image_shape, std::size_t label,
                                  const std::vector<double>& conv_w, const std::vector<std::size_t>& conv_w_shape, const std::vector<double>& conv_b,
                                  const std::vector<std::vector<double>>& dense_w, const std::vector<double>& dense_b) {
    std::size_t c_in = image_shape[0], h = image_shape[1], w = image_shape[2];
    std::size_t o_n = conv_w_shape[0], kh = conv_w_shape[2], kw = conv_w_shape[3];
    std::size_t oh = h - kh + 1, ow = w - kw + 1, ph = oh / 2, pw = ow / 2;
    std::vector<double> z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b);
    std::vector<double> a = relu(z);
    std::vector<std::vector<std::vector<double>>> maps;
    std::vector<double> flat;
    for (std::size_t o = 0; o < o_n; ++o) {
        maps.push_back(reshape(std::vector<double>(a.begin() + o * oh * ow, a.begin() + (o + 1) * oh * ow), oh, ow));
        std::vector<double> p = flatten(maxpool2d(maps.back(), 2));
        flat.insert(flat.end(), p.begin(), p.end());
    }
    std::vector<double> logits = vec_add(mat_vec(dense_w, flat), dense_b);

    std::vector<double> g = cross_entropy_grad(logits, label);
    std::vector<std::vector<double>> d_dense_w;
    for (double gk : g) d_dense_w.push_back(vec_scale(flat, gk));
    std::vector<double> d_flat = mat_vec(transpose(dense_w), g);
    std::vector<double> d_conv_w(conv_w.size(), 0.0), d_conv_b(o_n, 0.0);
    for (std::size_t o = 0; o < o_n; ++o) {
        std::vector<std::vector<double>> d_pool = reshape(std::vector<double>(d_flat.begin() + o * ph * pw, d_flat.begin() + (o + 1) * ph * pw), ph, pw);
        std::vector<std::vector<double>> d_a = maxpool2d_backward(maps[o], d_pool, 2);
        std::vector<std::vector<double>> d_z = reshape(relu_backward(std::vector<double>(z.begin() + o * oh * ow, z.begin() + (o + 1) * oh * ow), flatten(d_a)), oh, ow);
        d_conv_b[o] = vec_sum(flatten(d_z));
        for (std::size_t c = 0; c < c_in; ++c) {
            std::vector<std::vector<double>> channel = reshape(std::vector<double>(image.begin() + c * h * w, image.begin() + (c + 1) * h * w), h, w);
            std::vector<std::vector<double>> dk = conv2d_backward_kernel(channel, d_z);
            for (std::size_t u = 0; u < kh; ++u)
                for (std::size_t v = 0; v < kw; ++v) d_conv_w[((o * c_in + c) * kh + u) * kw + v] = dk[u][v];
        }
    }
    std::vector<double> out = d_conv_w;
    out.insert(out.end(), d_conv_b.begin(), d_conv_b.end());
    std::vector<double> dw = flatten(d_dense_w);
    out.insert(out.end(), dw.begin(), dw.end());
    out.insert(out.end(), g.begin(), g.end());
    return out;
}
