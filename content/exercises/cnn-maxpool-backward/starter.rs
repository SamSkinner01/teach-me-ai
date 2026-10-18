/// Backprop through maxpool2d(image, size). grad_out is dL/d(output), shape (H//size) x (W//size).
/// Return dL/d(image), the same shape as image: each window's gradient goes entirely to the
/// position that held the window's maximum (the first one in row-major order if tied);
/// every other position gets 0.
///
/// Signal an error if grad_out has the wrong shape or size is 0.
pub fn maxpool2d_backward(image: &[Vec<f64>], grad_out: &[Vec<f64>], size: usize) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
