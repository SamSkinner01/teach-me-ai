pub fn gradient_check(f: impl Fn(&[f64]) -> f64, x: &[f64], analytic: &[f64]) -> f64 {
    relative_error(analytic, &numerical_gradient(f, x, 1e-5))
}
