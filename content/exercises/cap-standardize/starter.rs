/// Standardize every pixel of every image: (x - mean) / std.
///
/// standardize([[0.0, 1.0]], 0.5, 0.5) == [[-1.0, 1.0]]
///
/// Signal an error if std <= 0.
pub fn standardize(images: &[Vec<f64>], mean: f64, std: f64) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
