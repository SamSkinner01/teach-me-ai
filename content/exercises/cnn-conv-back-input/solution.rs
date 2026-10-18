pub fn conv2d_backward_input(grad_out: &[Vec<f64>], kernel: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let k = kernel.len();
    assert!(kernel.iter().all(|r| r.len() == k), "the kernel must be square");
    let flipped: Vec<Vec<f64>> = kernel.iter().rev().map(|r| r.iter().rev().cloned().collect()).collect();
    conv2d(&pad2d(grad_out, k - 1), &flipped)
}
