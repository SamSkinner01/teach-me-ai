/// Estimate the gradient of `f` at the point `x` with central differences.
///
/// Entry i is (f(x + h·eᵢ) − f(x − h·eᵢ)) / (2h), where eᵢ is the unit
/// vector along axis i.
///
/// For f(x, y) = (x − 1)² + 2(y + 2)², the gradient at [0, 0] is about [-2, 8].
pub fn numerical_gradient(f: impl Fn(&[f64]) -> f64, x: &[f64], h: f64) -> Vec<f64> {
    // TODO
    todo!()
}
