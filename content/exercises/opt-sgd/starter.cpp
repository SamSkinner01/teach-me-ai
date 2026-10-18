#include <cstddef>
#include <stdexcept>
#include <vector>

// Fit y = w·x + b with mini-batch stochastic gradient descent.
//
// Start from w = b = 0. For each epoch e = 0, 1, ...:
//     order = shuffled_indices(seed + e, n)
//     for each consecutive slice of `order` of length batch_size
//     (the last slice may be shorter):
//         pred = w*xs[i] + b for i in the slice;  g = mse_grad(pred, ys of the slice)
//         w -= lr * dot(g, xs of the slice);      b -= lr * vec_sum(g)
//
// Return {w, b}. Throw std::invalid_argument if xs and ys differ in length.
std::vector<double> sgd_fit_line(const std::vector<double>& xs, const std::vector<double>& ys, double lr,
                                 std::size_t epochs, std::size_t batch_size, std::size_t seed) {
    // TODO
    throw std::logic_error("not implemented");
}
