pub fn maxpool2d(image: &[Vec<f64>], size: usize) -> Vec<Vec<f64>> {
    assert!(size > 0, "size must be positive");
    let (oh, ow) = (image.len() / size, image.first().map_or(0, |r| r.len()) / size);
    let mut out = vec![vec![0.0; ow]; oh];
    for i in 0..oh {
        for j in 0..ow {
            let mut best = image[i * size][j * size];
            for u in 0..size {
                for v in 0..size {
                    best = best.max(image[i * size + u][j * size + v]);
                }
            }
            out[i][j] = best;
        }
    }
    out
}
