pub fn dot(a: &[f64], b: &[f64]) -> f64 {
    assert_eq!(a.len(), b.len(), "dot product needs vectors of the same length");
    let mut total = 0.0;
    for i in 0..a.len() {
        total += a[i] * b[i];
    }
    total
}
