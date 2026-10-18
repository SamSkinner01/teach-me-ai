pub fn relative_error(a: &[f64], b: &[f64]) -> f64 {
    let diff = vec_add(a, &vec_scale(b, -1.0));
    let denom = norm(a) + norm(b);
    if denom == 0.0 {
        return 0.0;
    }
    norm(&diff) / denom
}
