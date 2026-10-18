/// Return the rows of m selected by idx, in that order: [m[idx[0]], m[idx[1]], ...].
/// This is how a mini-batch is pulled out of the dataset.
///
/// Signal an error if any index is out of range.
pub fn gather_rows(m: &[Vec<f64>], idx: &[usize]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
