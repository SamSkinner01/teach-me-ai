/// Return the matrix-vector product m · v.
///
/// `m` is a slice of rows. Entry i of the result is (row i of m) · v.
///
/// mat_vec(&[vec![1.0, 2.0], vec![3.0, 4.0]], &[1.0, 1.0]) == vec![3.0, 7.0]
///
/// Panic if the number of columns of `m` differs from `v.len()`.
pub fn mat_vec(m: &[Vec<f64>], v: &[f64]) -> Vec<f64> {
    // TODO
    todo!()
}
