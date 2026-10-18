#include <cmath>
#include <cstddef>
#include <stdexcept>
#include <vector>

// Return a fan_out × fan_in weight matrix with He initialization:
// standard normals (from random_normals(seed, fan_out * fan_in), filled
// row by row) scaled by sqrt(2 / fan_in).
//
// Tip: `random_normals`, `vec_scale` and `reshape` are in your library.
std::vector<std::vector<double>> he_init(std::size_t seed, std::size_t fan_in, std::size_t fan_out) {
    // TODO
    throw std::logic_error("not implemented");
}
