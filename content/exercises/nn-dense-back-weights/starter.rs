/// Backprop through z = x · wᵀ + b, for the weights.
/// grad_out is dL/dz (N x out) and x is the layer's input (N x in).
/// Return dL/dw (out x in, the same shape as w) = grad_outᵀ · x.
///
/// Tip: matmul and transpose are in your library.
pub fn dense_backward_weights(grad_out: &[Vec<f64>], x: &[Vec<f64>]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
