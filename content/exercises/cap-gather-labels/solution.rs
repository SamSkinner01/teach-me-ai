pub fn gather_labels(labels: &[usize], idx: &[usize]) -> Vec<usize> {
    idx.iter().map(|&i| labels[i]).collect()
}
