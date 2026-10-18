pub fn idx_labels(data: &[u8], limit: usize) -> Vec<usize> {
    let dims = idx_dims(data);
    assert_eq!(dims.len(), 1, "a label file has 1 dimension");
    data[8..8 + limit.min(dims[0])].iter().map(|&b| b as usize).collect()
}
