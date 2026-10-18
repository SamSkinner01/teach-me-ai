/// Return the expected value of a discrete random variable that takes
/// values[i] with probability probs[i].
///
/// expected_value(&[0.0, 10.0], &[0.9, 0.1]) == 1.0
///
/// Panic if the lengths differ, any probability is negative,
/// or the probabilities don't sum to 1 (within 1e-9).
pub fn expected_value(values: &[f64], probs: &[f64]) -> f64 {
    // TODO
    todo!()
}
