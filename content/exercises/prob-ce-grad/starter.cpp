#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the gradient of cross_entropy_loss(logits, label) with respect
// to each logit:  softmax(logits) − onehot(label).
//
// cross_entropy_grad({0.0, 0.0}, 0) == {-0.5, 0.5}
//
// Throw std::out_of_range if label is out of range.
// Tip: `softmax` is in your library.
std::vector<double> cross_entropy_grad(const std::vector<double>& logits, std::size_t label) {
    // TODO
    throw std::logic_error("not implemented");
}
