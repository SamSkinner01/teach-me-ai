#include <cmath>
#include <limits>
#include <vector>

std::vector<double> softmax(const std::vector<double>& logits) {
    double m = -std::numeric_limits<double>::infinity();
    for (double z : logits) {
        if (z > m) m = z;
    }
    std::vector<double> exps;
    exps.reserve(logits.size());
    for (double z : logits) {
        exps.push_back(std::exp(z - m));
    }
    return vec_scale(exps, 1.0 / vec_sum(exps));
}
