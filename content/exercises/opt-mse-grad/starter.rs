/// Return the gradient of mse_loss(pred, target) with respect to each prediction:
/// (2/n) · (pred[i] − target[i]).
///
/// mse_grad(&[2.0, 4.0], &[1.0, 2.0]) == vec![1.0, 2.0]
///
/// Panic if the lengths differ (or are zero).
pub fn mse_grad(pred: &[f64], target: &[f64]) -> Vec<f64> {
    // TODO
    todo!()
}
