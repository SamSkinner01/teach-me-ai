def neuron_grad(x: float, w: float, b: float) -> list[float]:
    s = sigmoid_derivative(w * x + b)
    return [s * x, s, s * w]
