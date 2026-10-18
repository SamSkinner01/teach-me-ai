pub fn mse_loss(pred: &[f64], target: &[f64]) -> f64 {
    assert!(pred.len() == target.len() && !pred.is_empty(), "need one target per prediction");
    let diff = vec_add(pred, &vec_scale(target, -1.0));
    dot(&diff, &diff) / pred.len() as f64
}
