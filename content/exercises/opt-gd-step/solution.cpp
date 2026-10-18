#include <vector>

std::vector<double> gd_step(const std::vector<double>& w, const std::vector<double>& grad, double lr) {
    return vec_add(w, vec_scale(grad, -lr));
}
