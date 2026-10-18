#include <vector>

std::vector<double> neuron_grad(double x, double w, double b) {
    double s = sigmoid_derivative(w * x + b);
    return {s * x, s, s * w};
}
