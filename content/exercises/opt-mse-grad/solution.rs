pub fn mse_grad(pred: &[f64], target: &[f64]) -> Vec<f64> {
    assert!(pred.len() == target.len() && !pred.is_empty(), "need one target per prediction");
    vec_scale(&vec_add(pred, &vec_scale(target, -1.0)), 2.0 / pred.len() as f64)
}
