#include <stdexcept>
#include <vector>

double mean(const std::vector<double>& v) {
    if (v.empty()) {
        throw std::invalid_argument("the mean of an empty vector is undefined");
    }
    return vec_sum(v) / static_cast<double>(v.size());
}
