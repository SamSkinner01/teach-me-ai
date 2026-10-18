#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the mean cross-entropy loss over a batch: the average over rows i of
// cross_entropy_loss(logits[i], labels[i]).
//
// Signal an error if there isn't exactly one label per row (or the batch is empty).
double batch_cross_entropy(const std::vector<std::vector<double>>& logits, const std::vector<std::size_t>& labels) {
    // TODO
    throw std::logic_error("not implemented");
}
