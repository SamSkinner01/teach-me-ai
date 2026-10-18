/// Train a 2-layer MLP (dense -> relu -> dense) with full-batch gradient descent and
/// return the final mean cross-entropy loss on the training data.
///
/// Initialization (exactly, so results match the tests):
///     W1 = he_init(seed, n_inputs, hidden),      b1 = zeros(hidden)
///     W2 = he_init(seed + 1, hidden, classes),   b2 = zeros(classes)
///
/// Each epoch:
///     z1 = dense_forward(xs, W1, b1);  h = relu of each row of z1
///     logits = dense_forward(h, W2, b2)
///     d_logits = batch_cross_entropy_grad(logits, labels)
///     dW2 = dense_backward_weights(d_logits, h);   db2 = dense_backward_bias(d_logits)
///     dh  = dense_backward_input(d_logits, W2)
///     dz1 = relu_backward of each row (z1[i], dh[i])
///     dW1 = dense_backward_weights(dz1, xs);       db1 = dense_backward_bias(dz1)
///     then every parameter -= lr * its gradient
///
/// Finally return batch_cross_entropy(mlp_forward(xs, W1, b1, W2, b2), labels).
pub fn train_mlp(xs: &[Vec<f64>], labels: &[usize], hidden: usize, classes: usize, lr: f64, epochs: usize, seed: usize) -> f64 {
    // TODO
    todo!()
}
