pub fn dense_backward_weights(grad_out: &[Vec<f64>], x: &[Vec<f64>]) -> Vec<Vec<f64>> {
    matmul(&transpose(grad_out), x)
}
