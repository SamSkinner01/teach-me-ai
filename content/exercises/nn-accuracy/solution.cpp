#include <cstddef>
#include <stdexcept>
#include <vector>

double accuracy(const std::vector<std::vector<double>>& logits, const std::vector<std::size_t>& labels) {
    if (logits.size() != labels.size() || logits.empty()) {
        throw std::invalid_argument("need exactly one label per row");
    }
    std::size_t correct = 0;
    for (std::size_t i = 0; i < logits.size(); ++i) {
        if (argmax(logits[i]) == labels[i]) ++correct;
    }
    return static_cast<double>(correct) / static_cast<double>(logits.size());
}
