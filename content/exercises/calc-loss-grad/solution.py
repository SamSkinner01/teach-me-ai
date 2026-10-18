def squared_error_grad_w(x: float, w: float, b: float, target: float) -> float:
    z = w * x + b
    y = sigmoid(z)
    return 2.0 * (y - target) * sigmoid_derivative(z) * x
