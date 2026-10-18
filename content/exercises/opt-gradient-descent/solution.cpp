#include <cstddef>
#include <functional>
#include <vector>

std::vector<double> gradient_descent(const std::function<double(const std::vector<double>&)>& f,
                                     const std::vector<double>& x0, double lr, std::size_t steps) {
    std::vector<double> x = x0;
    for (std::size_t i = 0; i < steps; ++i) {
        x = gd_step(x, numerical_gradient(f, x, 1e-5), lr);
    }
    return x;
}
