#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> cross_entropy_grad(const std::vector<double>& logits, std::size_t label) {
    if (label >= logits.size()) {
        throw std::out_of_range("label is out of range");
    }
    std::vector<double> grad = softmax(logits);
    grad[label] -= 1.0;
    return grad;
}
