pub fn class_accuracy(confusion: &[Vec<f64>]) -> Vec<f64> {
    confusion
        .iter()
        .enumerate()
        .map(|(i, row)| {
            let total = vec_sum(row);
            if total > 0.0 { row[i] / total } else { 0.0 }
        })
        .collect()
}
