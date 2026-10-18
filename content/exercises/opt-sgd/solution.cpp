#include <algorithm>
#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> sgd_fit_line(const std::vector<double>& xs, const std::vector<double>& ys, double lr,
                                 std::size_t epochs, std::size_t batch_size, std::size_t seed) {
    if (xs.size() != ys.size()) {
        throw std::invalid_argument("need one y per x");
    }
    std::size_t n = xs.size();
    double w = 0.0, b = 0.0;
    for (std::size_t e = 0; e < epochs; ++e) {
        std::vector<std::size_t> order = shuffled_indices(seed + e, n);
        for (std::size_t start = 0; start < n; start += batch_size) {
            std::size_t end = std::min(n, start + batch_size);
            std::vector<double> bx, by, pred;
            for (std::size_t k = start; k < end; ++k) {
                bx.push_back(xs[order[k]]);
                by.push_back(ys[order[k]]);
                pred.push_back(w * xs[order[k]] + b);
            }
            std::vector<double> g = mse_grad(pred, by);
            w -= lr * dot(g, bx);
            b -= lr * vec_sum(g);
        }
    }
    return {w, b};
}
