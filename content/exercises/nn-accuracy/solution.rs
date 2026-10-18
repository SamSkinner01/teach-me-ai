pub fn accuracy(logits: &[Vec<f64>], labels: &[usize]) -> f64 {
    assert!(logits.len() == labels.len() && !logits.is_empty(), "need exactly one label per row");
    let correct = logits.iter().zip(labels).filter(|(row, y)| argmax(row) == **y).count();
    correct as f64 / logits.len() as f64
}
