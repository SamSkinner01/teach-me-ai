#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Gradients of cross_entropy_loss(cnn_forward(...), label) with respect to every parameter,
// for one image. Return them concatenated in this order:
//
//     d_conv_w (same layout as conv_w) ++ d_conv_b ++ d_dense_w (row-major) ++ d_dense_b
//
// Backward pass:
//     g = cross_entropy_grad(logits, label)                 -> d_dense_b
//     d_dense_w[k][f] = g[k] * flat[f];   d_flat = dense_wᵀ · g
//     per channel o: d_pool = d_flat's slice for o, reshaped; d_a = maxpool2d_backward(a_o, d_pool, 2)
//                    d_z = relu_backward(z_o, d_a);  d_conv_b[o] = sum(d_z)
//                    per input channel c: d_conv_w[o, c] = conv2d_backward_kernel(image_c, d_z)
std::vector<double> cnn_gradients(const std::vector<double>& image, const std::vector<std::size_t>& image_shape, std::size_t label,
                                  const std::vector<double>& conv_w, const std::vector<std::size_t>& conv_w_shape, const std::vector<double>& conv_b,
                                  const std::vector<std::vector<double>>& dense_w, const std::vector<double>& dense_b) {
    // TODO
    throw std::logic_error("not implemented");
}
