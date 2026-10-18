#include <functional>
#include <vector>

std::vector<double> numerical_gradient(const std::function<double(const std::vector<double>&)>& f,
                                       const std::vector<double>& x, double h) {
    std::vector<double> grad(x.size());
    for (std::size_t i = 0; i < x.size(); ++i) {
        std::vector<double> plus = x, minus = x;
        plus[i] += h;
        minus[i] -= h;
        grad[i] = (f(plus) - f(minus)) / (2.0 * h);
    }
    return grad;
}
