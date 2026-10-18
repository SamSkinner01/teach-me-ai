#include <functional>

double central_difference(const std::function<double(double)>& f, double x, double h) {
    return (f(x + h) - f(x - h)) / (2.0 * h);
}
