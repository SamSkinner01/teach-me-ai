pub fn momentum_descent(f: impl Fn(&[f64]) -> f64, x0: &[f64], lr: f64, beta: f64, steps: usize) -> Vec<f64> {
    let mut x = x0.to_vec();
    let mut v = vec![0.0; x0.len()];
    for _ in 0..steps {
        let g = numerical_gradient(&f, &x, 1e-5);
        let mut next = momentum_step(&x, &v, &g, lr, beta);
        v = next.pop().unwrap();
        x = next.pop().unwrap();
    }
    x
}
