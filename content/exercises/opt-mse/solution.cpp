#include <stdexcept>
#include <vector>

double mse_loss(const std::vector<double>& pred, const std::vector<double>& target) {
    if (pred.size() != target.size() || pred.empty()) {
        throw std::invalid_argument("need one target per prediction");
    }
    std::vector<double> diff = vec_add(pred, vec_scale(target, -1.0));
    return dot(diff, diff) / static_cast<double>(pred.size());
}
