/// Backprop through z = x · wᵀ + b, for the input.
/// grad_out is dL/dz (N x out) and w is out x in. Return dL/dx (N x in) = grad_out · w.
///
/// Tip: matmul is in your library.
pub fn dense_backward_input(grad_out: &[Vec<f64>], w: &[Vec<f64>]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
