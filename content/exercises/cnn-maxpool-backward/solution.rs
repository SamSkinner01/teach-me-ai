pub fn maxpool2d_backward(image: &[Vec<f64>], grad_out: &[Vec<f64>], size: usize) -> Vec<Vec<f64>> {
    assert!(size > 0, "size must be positive");
    let (h, w) = (image.len(), image.first().map_or(0, |r| r.len()));
    let (oh, ow) = (h / size, w / size);
    assert!(grad_out.len() == oh && grad_out.iter().all(|r| r.len() == ow), "grad_out has the wrong shape");
    let mut out = vec![vec![0.0; w]; h];
    for i in 0..oh {
        for j in 0..ow {
            let (mut bi, mut bj) = (i * size, j * size);
            for u in 0..size {
                for v in 0..size {
                    if image[i * size + u][j * size + v] > image[bi][bj] {
                        bi = i * size + u;
                        bj = j * size + v;
                    }
                }
            }
            out[bi][bj] += grad_out[i][j];
        }
    }
    out
}
