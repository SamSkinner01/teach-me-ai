pub fn squared_error_grad_w(x: f64, w: f64, b: f64, target: f64) -> f64 {
    let z = w * x + b;
    let y = sigmoid(z);
    2.0 * (y - target) * sigmoid_derivative(z) * x
}
