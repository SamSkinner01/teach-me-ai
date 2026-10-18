pub fn random_normals(seed: usize, n: usize) -> Vec<f64> {
    let pairs = (n + 1) / 2;
    let u = random_uniforms(seed, 2 * pairs);
    let mut out = Vec::with_capacity(2 * pairs);
    for k in 0..pairs {
        let r = (-2.0 * u[2 * k].ln()).sqrt();
        let theta = 2.0 * std::f64::consts::PI * u[2 * k + 1];
        out.push(r * theta.cos());
        out.push(r * theta.sin());
    }
    out.truncate(n);
    out
}
