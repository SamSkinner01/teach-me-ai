pub fn pad2d(image: &[Vec<f64>], p: usize) -> Vec<Vec<f64>> {
    let (h, w) = (image.len(), image.first().map_or(0, |r| r.len()));
    let mut out = vec![vec![0.0; w + 2 * p]; h + 2 * p];
    for i in 0..h {
        for j in 0..w {
            out[i + p][j + p] = image[i][j];
        }
    }
    out
}
