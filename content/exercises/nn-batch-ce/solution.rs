pub fn batch_cross_entropy(logits: &[Vec<f64>], labels: &[usize]) -> f64 {
    assert!(logits.len() == labels.len() && !logits.is_empty(), "need exactly one label per row");
    let total: f64 = logits.iter().zip(labels).map(|(row, &y)| cross_entropy_loss(row, y)).sum();
    total / logits.len() as f64
}
