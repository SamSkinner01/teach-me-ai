pub fn numerical_gradient(f: impl Fn(&[f64]) -> f64, x: &[f64], h: f64) -> Vec<f64> {
    let mut grad = Vec::with_capacity(x.len());
    for i in 0..x.len() {
        let mut plus = x.to_vec();
        let mut minus = x.to_vec();
        plus[i] += h;
        minus[i] -= h;
        grad.push((f(&plus) - f(&minus)) / (2.0 * h));
    }
    grad
}
