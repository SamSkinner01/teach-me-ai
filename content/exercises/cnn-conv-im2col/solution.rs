pub fn conv2d_im2col(image: &[Vec<f64>], kernel: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let k = kernel.len();
    assert!(kernel.iter().all(|r| r.len() == k), "the kernel must be square");
    let flat = mat_vec(&im2col(image, k), &flatten(kernel));
    reshape(&flat, image.len() - k + 1, image[0].len() - k + 1)
}
