pub fn conv2d_strided(image: &[Vec<f64>], kernel: &[Vec<f64>], stride: usize, padding: usize) -> Vec<Vec<f64>> {
    let (kh, kw) = (kernel.len(), kernel[0].len());
    let oh = conv_output_size(image.len(), kh, stride, padding);
    let ow = conv_output_size(image[0].len(), kw, stride, padding);
    let padded = pad2d(image, padding);
    let mut out = vec![vec![0.0; ow]; oh];
    for i in 0..oh {
        for j in 0..ow {
            let mut s = 0.0;
            for u in 0..kh {
                for v in 0..kw {
                    s += padded[i * stride + u][j * stride + v] * kernel[u][v];
                }
            }
            out[i][j] = s;
        }
    }
    out
}
