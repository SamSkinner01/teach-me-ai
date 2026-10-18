/// Fit y = w·x + b with mini-batch stochastic gradient descent.
///
/// Start from w = b = 0. For each epoch e = 0, 1, ...:
///     order = shuffled_indices(seed + e, n)
///     for each consecutive chunk of `order` of length batch_size
///     (the last may be shorter; `order.chunks(batch_size)` does this):
///         pred = w*xs[i] + b for i in the chunk;  g = mse_grad(pred, ys of the chunk)
///         w -= lr * dot(g, xs of the chunk);      b -= lr * vec_sum(g)
///
/// Return vec![w, b]. Panic if xs and ys have different lengths.
pub fn sgd_fit_line(xs: &[f64], ys: &[f64], lr: f64, epochs: usize, batch_size: usize, seed: usize) -> Vec<f64> {
    // TODO
    todo!()
}
