/// Unroll every k x k patch of the image into a row (stride 1, no padding).
/// Rows are in output order (patch top-left (0,0), (0,1), ..., then the next row), and each row
/// lists its patch row-major. The result is ((H-k+1)*(W-k+1)) x (k*k).
///
/// Signal an error if k is 0 or larger than the image.
pub fn im2col(image: &[Vec<f64>], k: usize) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
