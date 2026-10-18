/// Backpropagate through relu. z is the input relu saw; grad_out is dL/d(relu(z)).
/// Return dL/dz: grad_out[i] where z[i] > 0, and 0 where z[i] <= 0.
///
/// relu_backward([-1.0, 2.0], [5.0, 5.0]) == [0.0, 5.0]
///
/// Signal an error if the lengths differ.
pub fn relu_backward(z: &[f64], grad_out: &[f64]) -> Vec<f64> {
    // TODO
    todo!()
}
