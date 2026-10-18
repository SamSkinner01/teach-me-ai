#include <cmath>
#include <vector>

double norm(const std::vector<double>& v) {
    return std::sqrt(dot(v, v));
}
