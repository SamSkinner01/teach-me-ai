pub fn gather_rows(m: &[Vec<f64>], idx: &[usize]) -> Vec<Vec<f64>> {
    idx.iter().map(|&i| m[i].clone()).collect()
}
