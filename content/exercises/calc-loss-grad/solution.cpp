double squared_error_grad_w(double x, double w, double b, double target) {
    double z = w * x + b;
    double y = sigmoid(z);
    return 2.0 * (y - target) * sigmoid_derivative(z) * x;
}
