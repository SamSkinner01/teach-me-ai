pub fn cnn_gradients(image: &[f64], image_shape: &[usize], label: usize, conv_w: &[f64], conv_w_shape: &[usize],
                     conv_b: &[f64], dense_w: &[Vec<f64>], dense_b: &[f64]) -> Vec<f64> {
    let (c_in, h, w) = (image_shape[0], image_shape[1], image_shape[2]);
    let (o_n, kh, kw) = (conv_w_shape[0], conv_w_shape[2], conv_w_shape[3]);
    let (oh, ow) = (h - kh + 1, w - kw + 1);
    let (ph, pw) = (oh / 2, ow / 2);
    let z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b);
    let a = relu(&z);
    let maps: Vec<Vec<Vec<f64>>> = (0..o_n).map(|o| reshape(&a[o * oh * ow..(o + 1) * oh * ow], oh, ow)).collect();
    let mut flat = Vec::new();
    for m in &maps {
        flat.extend(flatten(&maxpool2d(m, 2)));
    }
    let logits = vec_add(&mat_vec(dense_w, &flat), dense_b);

    let g = cross_entropy_grad(&logits, label);
    let d_dense_w: Vec<Vec<f64>> = g.iter().map(|&gk| vec_scale(&flat, gk)).collect();
    let d_flat = mat_vec(&transpose(dense_w), &g);
    let channels: Vec<Vec<Vec<f64>>> = (0..c_in).map(|c| reshape(&image[c * h * w..(c + 1) * h * w], h, w)).collect();
    let mut d_conv_w = vec![0.0; conv_w.len()];
    let mut d_conv_b = vec![0.0; o_n];
    for o in 0..o_n {
        let d_pool = reshape(&d_flat[o * ph * pw..(o + 1) * ph * pw], ph, pw);
        let d_a = maxpool2d_backward(&maps[o], &d_pool, 2);
        let d_z = reshape(&relu_backward(&z[o * oh * ow..(o + 1) * oh * ow], &flatten(&d_a)), oh, ow);
        d_conv_b[o] = vec_sum(&flatten(&d_z));
        for c in 0..c_in {
            let dk = conv2d_backward_kernel(&channels[c], &d_z);
            for u in 0..kh {
                for v in 0..kw {
                    d_conv_w[((o * c_in + c) * kh + u) * kw + v] = dk[u][v];
                }
            }
        }
    }
    let mut out = d_conv_w;
    out.extend(d_conv_b);
    out.extend(flatten(&d_dense_w));
    out.extend(g);
    out
}
