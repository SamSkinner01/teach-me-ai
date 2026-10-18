pub fn relu_backward(z: &[f64], grad_out: &[f64]) -> Vec<f64> {
    assert_eq!(z.len(), grad_out.len(), "need one gradient per input");
    z.iter().zip(grad_out).map(|(&x, &g)| if x > 0.0 { g } else { 0.0 }).collect()
}
