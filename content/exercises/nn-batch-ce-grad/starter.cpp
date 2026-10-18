#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the gradient of batch_cross_entropy(logits, labels) with respect to every logit:
// row i is cross_entropy_grad(logits[i], labels[i]) divided by N (the number of rows),
// because the loss is an average over the batch.
//
// Signal an error if there isn't exactly one label per row (or the batch is empty).
std::vector<std::vector<double>> batch_cross_entropy_grad(const std::vector<std::vector<double>>& logits, const std::vector<std::size_t>& labels) {
    // TODO
    throw std::logic_error("not implemented");
}
