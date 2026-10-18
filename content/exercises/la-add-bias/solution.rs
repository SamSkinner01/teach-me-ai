pub fn add_bias(m: &[Vec<f64>], b: &[f64]) -> Vec<Vec<f64>> {
    m.iter().map(|row| vec_add(row, b)).collect()
}
