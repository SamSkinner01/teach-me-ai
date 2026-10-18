#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

std::vector<double> class_accuracy(const std::vector<std::vector<double>>& confusion) {
    std::vector<double> out;
    for (std::size_t i = 0; i < confusion.size(); ++i) {
        double total = vec_sum(confusion[i]);
        out.push_back(total > 0 ? confusion[i][i] / total : 0.0);
    }
    return out;
}
