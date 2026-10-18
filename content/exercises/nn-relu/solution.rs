pub fn relu(v: &[f64]) -> Vec<f64> {
    v.iter().map(|&x| if x > 0.0 { x } else { 0.0 }).collect()
}
