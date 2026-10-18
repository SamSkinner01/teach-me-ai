/// Convolution as a matrix product, for a square k x k kernel:
///     patches = im2col(image, k)                    (positions x k*k)
///     flat = patches · flatten(kernel)               (one value per position)
///     return flat reshaped to (H-k+1) x (W-k+1)
///
/// It must give exactly the same answer as conv2d. im2col, mat_vec, flatten and reshape are in your library.
pub fn conv2d_im2col(image: &[Vec<f64>], kernel: &[Vec<f64>]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
