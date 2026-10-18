pub fn variance(v: &[f64]) -> f64 {
    let m = mean(v);
    let mut total = 0.0;
    for x in v {
        total += (x - m) * (x - m);
    }
    total / v.len() as f64
}
