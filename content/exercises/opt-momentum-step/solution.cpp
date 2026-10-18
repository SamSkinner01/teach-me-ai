#include <vector>

std::vector<std::vector<double>> momentum_step(const std::vector<double>& w, const std::vector<double>& velocity,
                                               const std::vector<double>& grad, double lr, double beta) {
    std::vector<double> v_new = vec_add(vec_scale(velocity, beta), grad);
    std::vector<double> w_new = vec_add(w, vec_scale(v_new, -lr));
    return {w_new, v_new};
}
