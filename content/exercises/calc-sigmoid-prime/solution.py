def sigmoid_derivative(x: float) -> float:
    s = sigmoid(x)
    return s * (1.0 - s)
