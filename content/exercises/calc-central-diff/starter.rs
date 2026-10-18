/// Estimate f'(x) with the central difference (f(x + h) - f(x - h)) / (2h).
///
/// central_difference(|x| x * x, 3.0, 0.5) == 6.0
pub fn central_difference(f: impl Fn(f64) -> f64, x: f64, h: f64) -> f64 {
    // TODO
    todo!()
}
