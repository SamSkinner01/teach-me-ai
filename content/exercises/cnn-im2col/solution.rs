pub fn im2col(image: &[Vec<f64>], k: usize) -> Vec<Vec<f64>> {
    let (h, w) = (image.len(), image.first().map_or(0, |r| r.len()));
    assert!(k > 0 && k <= h && k <= w, "the patch must fit inside the image");
    let mut rows = Vec::with_capacity((h - k + 1) * (w - k + 1));
    for i in 0..=h - k {
        for j in 0..=w - k {
            let mut row = Vec::with_capacity(k * k);
            for u in 0..k {
                for v in 0..k {
                    row.push(image[i + u][j + v]);
                }
            }
            rows.push(row);
        }
    }
    rows
}
