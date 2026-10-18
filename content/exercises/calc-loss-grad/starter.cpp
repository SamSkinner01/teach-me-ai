#include <stdexcept>

// The loss of a one-neuron model is L = (σ(w·x + b) − target)².
//
// Return ∂L/∂w: how much the loss changes when you nudge the weight.
//
// squared_error_grad_w(1.0, 0.0, 0.0, 1.0) == -0.25
//
// Tip: `sigmoid` and `sigmoid_derivative` are available.
double squared_error_grad_w(double x, double w, double b, double target) {
    // TODO
    throw std::logic_error("not implemented");
}
