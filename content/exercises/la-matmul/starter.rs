/// Return the matrix product a · b.
///
/// If `a` is n×k and `b` is k×m, the result is n×m and
/// result[i][j] = sum over t of a[i][t] * b[t][j].
///
/// matmul(&[vec![1.0, 2.0], vec![3.0, 4.0]], &[vec![5.0, 6.0], vec![7.0, 8.0]])
///     == vec![vec![19.0, 22.0], vec![43.0, 50.0]]
///
/// Panic if the number of columns of `a` differs from the number of rows of `b`.
pub fn matmul(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
