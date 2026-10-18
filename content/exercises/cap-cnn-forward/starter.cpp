#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// The capstone CNN's forward pass for one image (flat tensors, as in Module 6):
//
//     z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b)   shape [O, OH, OW]
//     a = relu(z)
//     for each channel o: reshape a's channel o to OH x OW, maxpool2d(..., 2), flatten
//     flat = all pooled channels concatenated in channel order
//     logits = dense_w · flat + dense_b
//
// Return the logits. Every step is in your library.
std::vector<double> cnn_forward(const std::vector<double>& image, const std::vector<std::size_t>& image_shape, const std::vector<double>& conv_w,
                                const std::vector<std::size_t>& conv_w_shape, const std::vector<double>& conv_b, const std::vector<std::vector<double>>& dense_w,
                                const std::vector<double>& dense_b) {
    // TODO
    throw std::logic_error("not implemented");
}
