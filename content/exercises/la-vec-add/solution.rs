pub fn vec_add(a: &[f64], b: &[f64]) -> Vec<f64> {
    assert_eq!(a.len(), b.len(), "cannot add vectors of different lengths");
    let mut out = Vec::with_capacity(a.len());
    for i in 0..a.len() {
        out.push(a[i] + b[i]);
    }
    out
}
