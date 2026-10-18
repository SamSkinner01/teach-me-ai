#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Per-class accuracy from a confusion matrix: for each true class i, the fraction of its
// examples that were predicted correctly, confusion[i][i] / (sum of row i).
// A class with no examples gets 0.
std::vector<double> class_accuracy(const std::vector<std::vector<double>>& confusion) {
    // TODO
    throw std::logic_error("not implemented");
}
