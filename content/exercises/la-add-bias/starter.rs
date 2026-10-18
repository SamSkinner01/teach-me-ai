/// Add the vector `b` to every row of `m` (broadcasting).
///
/// result[i][j] = m[i][j] + b[j]
///
/// add_bias(&[vec![1.0, 2.0, 3.0], vec![4.0, 5.0, 6.0]], &[10.0, 20.0, 30.0])
///     == vec![vec![11.0, 22.0, 33.0], vec![14.0, 25.0, 36.0]]
///
/// Panic if b.len() differs from the number of columns of `m`.
pub fn add_bias(m: &[Vec<f64>], b: &[f64]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
