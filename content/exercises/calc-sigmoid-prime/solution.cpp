double sigmoid_derivative(double x) {
    double s = sigmoid(x);
    return s * (1.0 - s);
}
