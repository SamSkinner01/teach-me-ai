pub fn softmax(logits: &[f64]) -> Vec<f64> {
    let m = logits.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let exps: Vec<f64> = logits.iter().map(|z| (z - m).exp()).collect();
    vec_scale(&exps, 1.0 / vec_sum(&exps))
}
