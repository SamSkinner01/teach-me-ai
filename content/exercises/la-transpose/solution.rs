pub fn transpose(m: &[Vec<f64>]) -> Vec<Vec<f64>> {
    if m.is_empty() {
        return Vec::new();
    }
    let (rows, cols) = (m.len(), m[0].len());
    let mut out = vec![vec![0.0; rows]; cols];
    for i in 0..rows {
        for j in 0..cols {
            out[j][i] = m[i][j];
        }
    }
    out
}
