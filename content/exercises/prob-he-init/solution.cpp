#include <cmath>
#include <cstddef>
#include <vector>

std::vector<std::vector<double>> he_init(std::size_t seed, std::size_t fan_in, std::size_t fan_out) {
    std::vector<double> z = random_normals(seed, fan_in * fan_out);
    double scale = std::sqrt(2.0 / static_cast<double>(fan_in));
    return reshape(vec_scale(z, scale), fan_out, fan_in);
}
