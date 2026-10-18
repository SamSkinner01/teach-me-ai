pub fn vec_sum(v: &[f64]) -> f64 {
    let mut total = 0.0;
    for x in v {
        total += x;
    }
    total
}
