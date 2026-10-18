#include <cstddef>
#include <stdexcept>
#include <vector>

double cross_entropy_loss(const std::vector<double>& logits, std::size_t label) {
    if (label >= logits.size()) {
        throw std::out_of_range("label is out of range");
    }
    return log_sum_exp(logits) - logits[label];
}
