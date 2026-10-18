#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> relu_backward(const std::vector<double>& z, const std::vector<double>& grad_out) {
    if (z.size() != grad_out.size()) throw std::invalid_argument("need one gradient per input");
    std::vector<double> out(z.size());
    for (std::size_t i = 0; i < z.size(); ++i) out[i] = z[i] > 0.0 ? grad_out[i] : 0.0;
    return out;
}
