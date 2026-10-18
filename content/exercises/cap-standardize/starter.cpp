#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Standardize every pixel of every image: (x - mean) / std_dev.
//
// standardize([[0.0, 1.0]], 0.5, 0.5) == [[-1.0, 1.0]]
//
// Signal an error if std_dev <= 0.
std::vector<std::vector<double>> standardize(const std::vector<std::vector<double>>& images, double mean, double std_dev) {
    // TODO
    throw std::logic_error("not implemented");
}
