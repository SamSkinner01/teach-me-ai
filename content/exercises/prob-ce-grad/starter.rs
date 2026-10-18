/// Return the gradient of cross_entropy_loss(logits, label) with respect
/// to each logit:  softmax(logits) − onehot(label).
///
/// cross_entropy_grad(&[0.0, 0.0], 0) == vec![-0.5, 0.5]
///
/// Panic if `label` is out of range.
/// Tip: `softmax` is in your library.
pub fn cross_entropy_grad(logits: &[f64], label: usize) -> Vec<f64> {
    // TODO
    todo!()
}
