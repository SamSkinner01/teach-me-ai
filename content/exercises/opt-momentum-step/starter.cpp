#include <stdexcept>
#include <vector>

// One step of gradient descent with momentum:
//
//     v_new = beta · velocity + grad
//     w_new = w − lr · v_new
//
// Return {w_new, v_new} (a 2-row matrix).
std::vector<std::vector<double>> momentum_step(const std::vector<double>& w, const std::vector<double>& velocity,
                                               const std::vector<double>& grad, double lr, double beta) {
    // TODO
    throw std::logic_error("not implemented");
}
