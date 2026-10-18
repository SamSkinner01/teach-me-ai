pub fn mean(v: &[f64]) -> f64 {
    assert!(!v.is_empty(), "the mean of an empty vector is undefined");
    vec_sum(v) / v.len() as f64
}
