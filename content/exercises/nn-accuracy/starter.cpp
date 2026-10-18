#include <cstddef>
#include <stdexcept>
#include <vector>

// Return the fraction of rows whose largest logit is at the correct label
// (argmax(logits[i]) == labels[i]), between 0 and 1.
//
// Signal an error if there isn't exactly one label per row (or the batch is empty).
double accuracy(const std::vector<std::vector<double>>& logits, const std::vector<std::size_t>& labels) {
    // TODO
    throw std::logic_error("not implemented");
}
