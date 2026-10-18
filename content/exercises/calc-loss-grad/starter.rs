/// The loss of a one-neuron model is L = (σ(w·x + b) − target)².
///
/// Return ∂L/∂w: how much the loss changes when you nudge the weight.
///
/// squared_error_grad_w(1.0, 0.0, 0.0, 1.0) == -0.25
///
/// Tip: `sigmoid` and `sigmoid_derivative` are available.
pub fn squared_error_grad_w(x: f64, w: f64, b: f64, target: f64) -> f64 {
    // TODO
    todo!()
}
