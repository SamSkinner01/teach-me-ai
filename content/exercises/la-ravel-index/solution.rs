pub fn ravel_index(index: &[usize], shape: &[usize]) -> usize {
    assert_eq!(index.len(), shape.len(), "index must have one entry per axis");
    for i in 0..shape.len() {
        assert!(index[i] < shape[i], "index {} out of range for axis {} of size {}", index[i], i, shape[i]);
    }
    let s = strides(shape);
    let mut flat = 0;
    for i in 0..index.len() {
        flat += index[i] * s[i];
    }
    flat
}
