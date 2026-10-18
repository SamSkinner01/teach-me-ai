#include <cstddef>
#include <functional>
#include <stdexcept>
#include <vector>

// Minimize f by gradient descent: start at x0 and take `steps` steps of
// x ← x − lr · gradient(f, x), using numerical_gradient with h = 1e-5.
// Return the final x.
//
// Tip: `numerical_gradient` and `gd_step` are in your library.
std::vector<double> gradient_descent(const std::function<double(const std::vector<double>&)>& f,
                                     const std::vector<double>& x0, double lr, std::size_t steps) {
    // TODO
    throw std::logic_error("not implemented");
}
