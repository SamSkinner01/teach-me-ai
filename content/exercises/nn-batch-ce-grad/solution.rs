pub fn batch_cross_entropy_grad(logits: &[Vec<f64>], labels: &[usize]) -> Vec<Vec<f64>> {
    assert!(logits.len() == labels.len() && !logits.is_empty(), "need exactly one label per row");
    let n = logits.len() as f64;
    logits.iter().zip(labels).map(|(row, &y)| vec_scale(&cross_entropy_grad(row, y), 1.0 / n)).collect()
}
