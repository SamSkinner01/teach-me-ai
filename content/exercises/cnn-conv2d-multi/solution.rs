pub fn conv2d_multi(x: &[f64], x_shape: &[usize], w: &[f64], w_shape: &[usize], b: &[f64]) -> Vec<f64> {
    let (c_in, h, wd) = (x_shape[0], x_shape[1], x_shape[2]);
    let (o_n, c_w, kh, kw) = (w_shape[0], w_shape[1], w_shape[2], w_shape[3]);
    assert!(x.len() == c_in * h * wd && w.len() == o_n * c_w * kh * kw && c_w == c_in && b.len() == o_n, "shapes don't match");
    assert!(kh <= h && kw <= wd, "the kernel must fit inside the image");
    let (oh, ow) = (h - kh + 1, wd - kw + 1);
    let mut out = vec![0.0; o_n * oh * ow];
    for o in 0..o_n {
        for i in 0..oh {
            for j in 0..ow {
                let mut s = b[o];
                for c in 0..c_in {
                    for u in 0..kh {
                        for v in 0..kw {
                            s += w[((o * c_in + c) * kh + u) * kw + v] * x[(c * h + i + u) * wd + j + v];
                        }
                    }
                }
                out[(o * oh + i) * ow + j] = s;
            }
        }
    }
    out
}
