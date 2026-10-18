/// Minimize `f` by gradient descent: start at x0 and take `steps` steps of
/// x ← x − lr · gradient(f, x), using numerical_gradient with h = 1e-5.
/// Return the final x.
///
/// Tip: `numerical_gradient` and `gd_step` are in your library. Pass `&f` to
/// numerical_gradient so you can keep using `f` in the next iteration.
pub fn gradient_descent(f: impl Fn(&[f64]) -> f64, x0: &[f64], lr: f64, steps: usize) -> Vec<f64> {
    // TODO
    todo!()
}
