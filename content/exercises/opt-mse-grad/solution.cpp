#include <stdexcept>
#include <vector>

std::vector<double> mse_grad(const std::vector<double>& pred, const std::vector<double>& target) {
    if (pred.size() != target.size() || pred.empty()) {
        throw std::invalid_argument("need one target per prediction");
    }
    return vec_scale(vec_add(pred, vec_scale(target, -1.0)), 2.0 / static_cast<double>(pred.size()));
}
