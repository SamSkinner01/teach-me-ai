#include <cmath>
#include <cstddef>
#include <numbers>
#include <vector>

std::vector<double> random_normals(std::size_t seed, std::size_t n) {
    std::size_t pairs = (n + 1) / 2;
    std::vector<double> u = random_uniforms(seed, 2 * pairs);
    std::vector<double> out;
    out.reserve(2 * pairs);
    for (std::size_t k = 0; k < pairs; ++k) {
        double r = std::sqrt(-2.0 * std::log(u[2 * k]));
        double theta = 2.0 * std::numbers::pi * u[2 * k + 1];
        out.push_back(r * std::cos(theta));
        out.push_back(r * std::sin(theta));
    }
    out.resize(n);
    return out;
}
