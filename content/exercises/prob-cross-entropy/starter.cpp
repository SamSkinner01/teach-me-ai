#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the cross-entropy loss −ln(softmax(logits)[label]):
// how surprised the model is that the true class is `label`.
//
// cross_entropy_loss({0.0, 0.0}, 0) == std::log(2.0)
//
// Compute it stably (it must be finite for logits like {1000, 0}).
// Throw std::out_of_range if label is out of range.
// Tip: `log_sum_exp` is in your library.
double cross_entropy_loss(const std::vector<double>& logits, std::size_t label) {
    // TODO
    throw std::logic_error("not implemented");
}
