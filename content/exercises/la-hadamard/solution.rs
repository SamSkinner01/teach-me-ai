pub fn hadamard(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    assert_eq!(a.len(), b.len(), "hadamard product needs matrices of the same shape");
    a.iter()
        .zip(b)
        .map(|(ra, rb)| {
            assert_eq!(ra.len(), rb.len(), "hadamard product needs matrices of the same shape");
            ra.iter().zip(rb).map(|(x, y)| x * y).collect()
        })
        .collect()
}
