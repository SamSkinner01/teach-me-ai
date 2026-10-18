/// Estimate f'(x) with the forward difference (f(x + h) - f(x)) / h.
///
/// forward_difference(|x| x * x, 3.0, 0.5) == 6.5
///
/// `impl Fn(f64) -> f64` means "any function or closure that takes an
/// f64 and returns an f64". Call it like a normal function: f(x).
pub fn forward_difference(f: impl Fn(f64) -> f64, x: f64, h: f64) -> f64 {
    // TODO
    todo!()
}
