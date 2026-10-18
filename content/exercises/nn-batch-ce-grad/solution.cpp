#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> batch_cross_entropy_grad(const std::vector<std::vector<double>>& logits, const std::vector<std::size_t>& labels) {
    if (logits.size() != labels.size() || logits.empty()) {
        throw std::invalid_argument("need exactly one label per row");
    }
    double n = static_cast<double>(logits.size());
    std::vector<std::vector<double>> out;
    for (std::size_t i = 0; i < logits.size(); ++i) out.push_back(vec_scale(cross_entropy_grad(logits[i], labels[i]), 1.0 / n));
    return out;
}
