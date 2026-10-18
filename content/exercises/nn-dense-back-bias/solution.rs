pub fn dense_backward_bias(grad_out: &[Vec<f64>]) -> Vec<f64> {
    assert!(!grad_out.is_empty(), "empty batch");
    let mut total = vec![0.0; grad_out[0].len()];
    for row in grad_out {
        total = vec_add(&total, row);
    }
    total
}
