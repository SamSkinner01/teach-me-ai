pub fn expected_value(values: &[f64], probs: &[f64]) -> f64 {
    assert_eq!(values.len(), probs.len(), "need exactly one probability per value");
    assert!(probs.iter().all(|&p| p >= 0.0), "probabilities can't be negative");
    assert!((vec_sum(probs) - 1.0).abs() <= 1e-9, "probabilities must sum to 1");
    dot(values, probs)
}
