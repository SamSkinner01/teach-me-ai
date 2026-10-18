/// Return the cross-entropy loss −ln(softmax(logits)[label]):
/// how surprised the model is that the true class is `label`.
///
/// cross_entropy_loss(&[0.0, 0.0], 0) == 2f64.ln()
///
/// Compute it stably (it must be finite for logits like [1000, 0]).
/// Panic if `label` is out of range.
/// Tip: `log_sum_exp` is in your library.
pub fn cross_entropy_loss(logits: &[f64], label: usize) -> f64 {
    // TODO
    todo!()
}
