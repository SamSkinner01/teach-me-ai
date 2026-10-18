#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> conv2d_im2col(const std::vector<std::vector<double>>& image, const std::vector<std::vector<double>>& kernel) {
    std::size_t k = kernel.size();
    for (const auto& r : kernel)
        if (r.size() != k) throw std::invalid_argument("the kernel must be square");
    std::vector<double> flat = mat_vec(im2col(image, k), flatten(kernel));
    return reshape(flat, image.size() - k + 1, image[0].size() - k + 1);
}
