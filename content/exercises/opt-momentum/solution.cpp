#include <cstddef>
#include <functional>
#include <vector>

std::vector<double> momentum_descent(const std::function<double(const std::vector<double>&)>& f,
                                     const std::vector<double>& x0, double lr, double beta,
                                     std::size_t steps) {
    std::vector<double> x = x0;
    std::vector<double> v(x0.size(), 0.0);
    for (std::size_t i = 0; i < steps; ++i) {
        std::vector<std::vector<double>> next = momentum_step(x, v, numerical_gradient(f, x, 1e-5), lr, beta);
        x = next[0];
        v = next[1];
    }
    return x;
}
