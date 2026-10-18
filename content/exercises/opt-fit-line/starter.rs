/// Fit y = w·x + b to the points by full-batch gradient descent on the
/// mean squared error. Start from w = b = 0 and do `epochs` updates:
///
///     pred = [w*x + b for each x]
///     g = mse_grad(pred, ys)
///     w -= lr * dot(g, xs);   b -= lr * vec_sum(g)
///
/// Return vec![w, b]. Panic if xs and ys have different lengths.
pub fn fit_line(xs: &[f64], ys: &[f64], lr: f64, epochs: usize) -> Vec<f64> {
    // TODO
    todo!()
}
