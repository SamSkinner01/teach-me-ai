#include <functional>
#include <stdexcept>

// Estimate f'(x) with the central difference (f(x + h) - f(x - h)) / (2h).
//
// central_difference([](double x) { return x * x; }, 3.0, 0.5) == 6.0
double central_difference(const std::function<double(double)>& f, double x, double h) {
    // TODO
    throw std::logic_error("not implemented");
}
