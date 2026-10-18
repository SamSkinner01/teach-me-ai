#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Count predictions by true class (rows) and predicted class (columns):
// result[actual][predicted] = number of examples with that pair. Returns a classes x classes
// matrix of counts; the diagonal holds the correct predictions.
//
// Signal an error if the lists differ in length or contain a class >= classes.
std::vector<std::vector<double>> confusion_matrix(const std::vector<std::size_t>& predicted, const std::vector<std::size_t>& actual, std::size_t classes) {
    // TODO
    throw std::logic_error("not implemented");
}
