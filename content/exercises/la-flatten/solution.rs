pub fn flatten(m: &[Vec<f64>]) -> Vec<f64> {
    let mut out = Vec::new();
    for row in m {
        out.extend_from_slice(row);
    }
    out
}
