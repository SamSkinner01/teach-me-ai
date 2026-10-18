#include <cstddef>
#include <stdexcept>
#include <vector>

// Fit y = w·x + b to the points by full-batch gradient descent on the
// mean squared error. Start from w = b = 0 and do `epochs` updates:
//
//     pred = [w*x + b for each x]
//     g = mse_grad(pred, ys)
//     w -= lr * dot(g, xs);   b -= lr * vec_sum(g)
//
// Return {w, b}. Throw std::invalid_argument if xs and ys differ in length.
std::vector<double> fit_line(const std::vector<double>& xs, const std::vector<double>& ys, double lr,
                             std::size_t epochs) {
    // TODO
    throw std::logic_error("not implemented");
}
