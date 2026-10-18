#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<double> cnn_forward(const std::vector<double>& image, const std::vector<std::size_t>& image_shape, const std::vector<double>& conv_w,
                                const std::vector<std::size_t>& conv_w_shape, const std::vector<double>& conv_b, const std::vector<std::vector<double>>& dense_w,
                                const std::vector<double>& dense_b) {
    std::vector<double> a = relu(conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b));
    std::size_t oh = image_shape[1] - conv_w_shape[2] + 1, ow = image_shape[2] - conv_w_shape[3] + 1;
    std::vector<double> flat;
    for (std::size_t o = 0; o < conv_w_shape[0]; ++o) {
        std::vector<double> slice(a.begin() + o * oh * ow, a.begin() + (o + 1) * oh * ow);
        std::vector<double> pooled = flatten(maxpool2d(reshape(slice, oh, ow), 2));
        flat.insert(flat.end(), pooled.begin(), pooled.end());
    }
    return vec_add(mat_vec(dense_w, flat), dense_b);
}
