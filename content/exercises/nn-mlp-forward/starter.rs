/// A two-layer perceptron: dense -> relu -> dense.
///
///     h = relu applied to every row of dense_forward(x, w1, b1)
///     logits = dense_forward(h, w2, b2)
///
/// Return the logits (N x classes).
pub fn mlp_forward(x: &[Vec<f64>], w1: &[Vec<f64>], b1: &[f64], w2: &[Vec<f64>], b2: &[f64]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
