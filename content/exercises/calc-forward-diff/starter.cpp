#include <functional>
#include <stdexcept>

// Estimate f'(x) with the forward difference (f(x + h) - f(x)) / h.
//
// forward_difference([](double x) { return x * x; }, 3.0, 0.5) == 6.5
//
// std::function<double(double)> holds any callable that takes a double
// and returns a double. Call it like a normal function: f(x).
double forward_difference(const std::function<double(double)>& f, double x, double h) {
    // TODO
    throw std::logic_error("not implemented");
}
