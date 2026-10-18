#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<std::vector<double>> confusion_matrix(const std::vector<std::size_t>& predicted, const std::vector<std::size_t>& actual, std::size_t classes) {
    if (predicted.size() != actual.size()) throw std::invalid_argument("one prediction per example");
    std::vector<std::vector<double>> m(classes, std::vector<double>(classes, 0.0));
    for (std::size_t i = 0; i < predicted.size(); ++i) {
        if (predicted[i] >= classes || actual[i] >= classes) throw std::invalid_argument("class out of range");
        m[actual[i]][predicted[i]] += 1.0;
    }
    return m;
}
