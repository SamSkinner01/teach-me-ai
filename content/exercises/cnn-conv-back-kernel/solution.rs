pub fn conv2d_backward_kernel(image: &[Vec<f64>], grad_out: &[Vec<f64>]) -> Vec<Vec<f64>> {
    conv2d(image, grad_out)
}
