#include <cstddef>
#include <stdexcept>
#include <vector>

double train_mlp(const std::vector<std::vector<double>>& xs, const std::vector<std::size_t>& labels, std::size_t hidden,
                 std::size_t classes, double lr, std::size_t epochs, std::size_t seed) {
    std::vector<std::vector<double>> w1 = he_init(seed, xs[0].size(), hidden);
    std::vector<double> b1(hidden, 0.0);
    std::vector<std::vector<double>> w2 = he_init(seed + 1, hidden, classes);
    std::vector<double> b2(classes, 0.0);
    for (std::size_t e = 0; e < epochs; ++e) {
        std::vector<std::vector<double>> z1 = dense_forward(xs, w1, b1);
        std::vector<std::vector<double>> h = z1;
        for (auto& row : h) row = relu(row);
        std::vector<std::vector<double>> logits = dense_forward(h, w2, b2);
        std::vector<std::vector<double>> d_logits = batch_cross_entropy_grad(logits, labels);
        std::vector<std::vector<double>> dw2 = dense_backward_weights(d_logits, h);
        std::vector<double> db2 = dense_backward_bias(d_logits);
        std::vector<std::vector<double>> dh = dense_backward_input(d_logits, w2);
        std::vector<std::vector<double>> dz1(z1.size());
        for (std::size_t i = 0; i < z1.size(); ++i) dz1[i] = relu_backward(z1[i], dh[i]);
        std::vector<std::vector<double>> dw1 = dense_backward_weights(dz1, xs);
        std::vector<double> db1 = dense_backward_bias(dz1);
        for (std::size_t i = 0; i < w1.size(); ++i) w1[i] = gd_step(w1[i], dw1[i], lr);
        b1 = gd_step(b1, db1, lr);
        for (std::size_t i = 0; i < w2.size(); ++i) w2[i] = gd_step(w2[i], dw2[i], lr);
        b2 = gd_step(b2, db2, lr);
    }
    return batch_cross_entropy(mlp_forward(xs, w1, b1, w2, b2), labels);
}
