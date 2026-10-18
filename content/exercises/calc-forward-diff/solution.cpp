#include <functional>

double forward_difference(const std::function<double(double)>& f, double x, double h) {
    return (f(x + h) - f(x)) / h;
}
