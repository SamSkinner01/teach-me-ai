/// Max pooling: split the image into non-overlapping size x size windows (stride = size)
/// and keep the largest value in each. Leftover rows/columns that don't fill a whole
/// window are dropped, so the output is (H // size) x (W // size).
///
/// Signal an error if size is 0.
pub fn maxpool2d(image: &[Vec<f64>], size: usize) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
