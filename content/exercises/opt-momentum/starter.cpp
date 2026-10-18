#include <cstddef>
#include <functional>
#include <stdexcept>
#include <vector>

// Minimize f with momentum: start at x0 with zero velocity, and take
// `steps` momentum steps using numerical_gradient(f, x, 1e-5).
// Return the final x.
//
// Tip: `numerical_gradient` and `momentum_step` are in your library.
std::vector<double> momentum_descent(const std::function<double(const std::vector<double>&)>& f,
                                     const std::vector<double>& x0, double lr, double beta,
                                     std::size_t steps) {
    // TODO
    throw std::logic_error("not implemented");
}
