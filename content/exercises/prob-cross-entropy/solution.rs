pub fn cross_entropy_loss(logits: &[f64], label: usize) -> f64 {
    assert!(label < logits.len(), "label {} is out of range for {} classes", label, logits.len());
    log_sum_exp(logits) - logits[label]
}
