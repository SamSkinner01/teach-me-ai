pub fn log_sum_exp(v: &[f64]) -> f64 {
    assert!(!v.is_empty(), "log_sum_exp of an empty vector");
    let m = v.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let total: f64 = v.iter().map(|x| (x - m).exp()).sum();
    m + total.ln()
}
