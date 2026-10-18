#include <functional>
#include <vector>

double gradient_check(const std::function<double(const std::vector<double>&)>& f,
                      const std::vector<double>& x, const std::vector<double>& analytic) {
    return relative_error(analytic, numerical_gradient(f, x, 1e-5));
}
