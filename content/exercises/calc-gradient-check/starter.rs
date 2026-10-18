/// Return the relative error between `analytic` (a gradient you derived
/// by hand) and the numerical gradient of `f` at `x`, using h = 1e-5.
///
/// Values below ~1e-7 mean the analytic gradient is almost certainly right.
///
/// Tip: `numerical_gradient` and `relative_error` are available.
pub fn gradient_check(f: impl Fn(&[f64]) -> f64, x: &[f64], analytic: &[f64]) -> f64 {
    // TODO
    todo!()
}
