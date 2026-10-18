pub fn cnn_forward(image: &[f64], image_shape: &[usize], conv_w: &[f64], conv_w_shape: &[usize],
                   conv_b: &[f64], dense_w: &[Vec<f64>], dense_b: &[f64]) -> Vec<f64> {
    let z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b);
    let a = relu(&z);
    let oh = image_shape[1] - conv_w_shape[2] + 1;
    let ow = image_shape[2] - conv_w_shape[3] + 1;
    let mut flat = Vec::new();
    for o in 0..conv_w_shape[0] {
        let fmap = reshape(&a[o * oh * ow..(o + 1) * oh * ow], oh, ow);
        flat.extend(flatten(&maxpool2d(&fmap, 2)));
    }
    vec_add(&mat_vec(dense_w, &flat), dense_b)
}
