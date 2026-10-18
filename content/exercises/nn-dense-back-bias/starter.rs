/// Backprop through z = x · wᵀ + b, for the bias.
/// grad_out is dL/dz (N x out). Return dL/db (`out` entries): the sum of each column of grad_out.
///
/// Signal an error if grad_out is empty.
pub fn dense_backward_bias(grad_out: &[Vec<f64>]) -> Vec<f64> {
    // TODO
    todo!()
}
