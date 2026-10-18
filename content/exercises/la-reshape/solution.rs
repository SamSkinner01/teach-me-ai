pub fn reshape(v: &[f64], rows: usize, cols: usize) -> Vec<Vec<f64>> {
    assert_eq!(rows * cols, v.len(), "rows * cols must equal the number of elements");
    (0..rows).map(|r| v[r * cols..(r + 1) * cols].to_vec()).collect()
}
