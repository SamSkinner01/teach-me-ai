/// Minimize `f` with momentum: start at x0 with zero velocity, and take
/// `steps` momentum steps using numerical_gradient(&f, &x, 1e-5).
/// Return the final x.
///
/// Tip: `numerical_gradient` and `momentum_step` are in your library.
pub fn momentum_descent(f: impl Fn(&[f64]) -> f64, x0: &[f64], lr: f64, beta: f64, steps: usize) -> Vec<f64> {
    // TODO
    todo!()
}
