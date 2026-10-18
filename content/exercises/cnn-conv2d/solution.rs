pub fn conv2d(image: &[Vec<f64>], kernel: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let (h, w) = (image.len(), image.first().map_or(0, |r| r.len()));
    let (kh, kw) = (kernel.len(), kernel.first().map_or(0, |r| r.len()));
    assert!(kh > 0 && kw > 0 && kh <= h && kw <= w, "the kernel must fit inside the image");
    let mut out = vec![vec![0.0; w - kw + 1]; h - kh + 1];
    for i in 0..=h - kh {
        for j in 0..=w - kw {
            let mut s = 0.0;
            for u in 0..kh {
                for v in 0..kw {
                    s += image[i + u][j + v] * kernel[u][v];
                }
            }
            out[i][j] = s;
        }
    }
    out
}
