/// Return the mean cross-entropy loss over a batch: the average over rows i of
/// cross_entropy_loss(logits[i], labels[i]).
///
/// Signal an error if there isn't exactly one label per row (or the batch is empty).
pub fn batch_cross_entropy(logits: &[Vec<f64>], labels: &[usize]) -> f64 {
    // TODO
    todo!()
}
