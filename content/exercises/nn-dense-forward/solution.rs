pub fn dense_forward(x: &[Vec<f64>], w: &[Vec<f64>], b: &[f64]) -> Vec<Vec<f64>> {
    add_bias(&matmul(x, &transpose(w)), b)
}
