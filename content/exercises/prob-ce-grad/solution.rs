pub fn cross_entropy_grad(logits: &[f64], label: usize) -> Vec<f64> {
    assert!(label < logits.len(), "label {} is out of range for {} classes", label, logits.len());
    let mut grad = softmax(logits);
    grad[label] -= 1.0;
    grad
}
