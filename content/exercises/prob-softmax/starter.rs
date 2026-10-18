/// Turn a vector of scores (logits) into probabilities:
///
///     softmax(z)[i] = exp(z[i]) / Σ_j exp(z[j])
///
/// softmax(&[0.0, 0.0]) == vec![0.5, 0.5]
///
/// It must work for huge scores like [1000, 1001, 1002] too.
/// Tip: `vec_sum` and `vec_scale` are in your library.
pub fn softmax(logits: &[f64]) -> Vec<f64> {
    // TODO
    todo!()
}
