#include <cstddef>
#include <stdexcept>
#include <vector>

double batch_cross_entropy(const std::vector<std::vector<double>>& logits, const std::vector<std::size_t>& labels) {
    if (logits.size() != labels.size() || logits.empty()) {
        throw std::invalid_argument("need exactly one label per row");
    }
    double total = 0.0;
    for (std::size_t i = 0; i < logits.size(); ++i) total += cross_entropy_loss(logits[i], labels[i]);
    return total / static_cast<double>(logits.size());
}
