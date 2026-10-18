pub fn gradient_descent(f: impl Fn(&[f64]) -> f64, x0: &[f64], lr: f64, steps: usize) -> Vec<f64> {
    let mut x = x0.to_vec();
    for _ in 0..steps {
        let g = numerical_gradient(&f, &x, 1e-5);
        x = gd_step(&x, &g, lr);
    }
    x
}
