/// The capstone CNN's forward pass for one image (flat tensors, as in Module 6):
///
///     z = conv2d_multi(image, image_shape, conv_w, conv_w_shape, conv_b)   shape [O, OH, OW]
///     a = relu(z)
///     for each channel o: reshape a's channel o to OH x OW, maxpool2d(..., 2), flatten
///     flat = all pooled channels concatenated in channel order
///     logits = dense_w · flat + dense_b
///
/// Return the logits. Every step is in your library.
pub fn cnn_forward(image: &[f64], image_shape: &[usize], conv_w: &[f64], conv_w_shape: &[usize],
                   conv_b: &[f64], dense_w: &[Vec<f64>], dense_b: &[f64]) -> Vec<f64> {
    // TODO
    todo!()
}
