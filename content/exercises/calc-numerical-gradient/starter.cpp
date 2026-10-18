#include <functional>
#include <stdexcept>
#include <vector>

// Estimate the gradient of f at the point x with central differences.
//
// Entry i is (f(x + h·eᵢ) − f(x − h·eᵢ)) / (2h), where eᵢ is the unit
// vector along axis i.
//
// For f(x, y) = (x − 1)² + 2(y + 2)², the gradient at {0, 0} is about {-2, 8}.
std::vector<double> numerical_gradient(const std::function<double(const std::vector<double>&)>& f,
                                       const std::vector<double>& x, double h) {
    // TODO
    throw std::logic_error("not implemented");
}
