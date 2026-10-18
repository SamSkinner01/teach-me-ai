pub fn neuron_grad(x: f64, w: f64, b: f64) -> Vec<f64> {
    let s = sigmoid_derivative(w * x + b);
    vec![s * x, s, s * w]
}
