/// Gradients of cross_entropy_loss(cnn_forward(...), label) with respect to every parameter,
/// for one image. Return them concatenated in this order:
///
///     d_conv_w (same layout as conv_w) ++ d_conv_b ++ d_dense_w (row-major) ++ d_dense_b
///
/// Backward pass:
///     g = cross_entropy_grad(logits, label)                 -> d_dense_b
///     d_dense_w[k][f] = g[k] * flat[f];   d_flat = dense_wᵀ · g
///     per channel o: d_pool = d_flat's slice for o, reshaped; d_a = maxpool2d_backward(a_o, d_pool, 2)
///                    d_z = relu_backward(z_o, d_a);  d_conv_b[o] = sum(d_z)
///                    per input channel c: d_conv_w[o, c] = conv2d_backward_kernel(image_c, d_z)
pub fn cnn_gradients(image: &[f64], image_shape: &[usize], label: usize, conv_w: &[f64], conv_w_shape: &[usize],
                     conv_b: &[f64], dense_w: &[Vec<f64>], dense_b: &[f64]) -> Vec<f64> {
    // TODO
    todo!()
}
