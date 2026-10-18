pub fn dense_backward_input(grad_out: &[Vec<f64>], w: &[Vec<f64>]) -> Vec<Vec<f64>> {
    matmul(grad_out, w)
}
