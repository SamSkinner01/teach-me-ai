pub fn matmul(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let k = if a.is_empty() { 0 } else { a[0].len() };
    assert_eq!(k, b.len(), "cannot multiply: a's columns must equal b's rows");
    let m = if b.is_empty() { 0 } else { b[0].len() };
    let mut out = vec![vec![0.0; m]; a.len()];
    for i in 0..a.len() {
        for j in 0..m {
            let mut total = 0.0;
            for t in 0..k {
                total += a[i][t] * b[t][j];
            }
            out[i][j] = total;
        }
    }
    out
}
