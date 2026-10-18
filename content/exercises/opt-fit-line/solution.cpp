#include <cstddef>
#include <stdexcept>
#include <vector>

std::vector<double> fit_line(const std::vector<double>& xs, const std::vector<double>& ys, double lr,
                             std::size_t epochs) {
    if (xs.size() != ys.size()) {
        throw std::invalid_argument("need one y per x");
    }
    double w = 0.0, b = 0.0;
    for (std::size_t e = 0; e < epochs; ++e) {
        std::vector<double> pred;
        pred.reserve(xs.size());
        for (double x : xs) pred.push_back(w * x + b);
        std::vector<double> g = mse_grad(pred, ys);
        w -= lr * dot(g, xs);
        b -= lr * vec_sum(g);
    }
    return {w, b};
}
