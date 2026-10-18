pub fn mlp_forward(x: &[Vec<f64>], w1: &[Vec<f64>], b1: &[f64], w2: &[Vec<f64>], b2: &[f64]) -> Vec<Vec<f64>> {
    let h: Vec<Vec<f64>> = dense_forward(x, w1, b1).iter().map(|row| relu(row)).collect();
    dense_forward(&h, w2, b2)
}
