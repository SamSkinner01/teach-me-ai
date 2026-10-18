#include <functional>
#include <stdexcept>
#include <vector>

// Return the relative error between `analytic` (a gradient you derived
// by hand) and the numerical gradient of f at x, using h = 1e-5.
//
// Values below ~1e-7 mean the analytic gradient is almost certainly right.
//
// Tip: `numerical_gradient` and `relative_error` are available.
double gradient_check(const std::function<double(const std::vector<double>&)>& f,
                      const std::vector<double>& x, const std::vector<double>& analytic) {
    // TODO
    throw std::logic_error("not implemented");
}
