pub fn idx_images(data: &[u8], limit: usize) -> Vec<Vec<f64>> {
    let dims = idx_dims(data);
    assert_eq!(dims.len(), 3, "an image file has 3 dimensions");
    let size = dims[1] * dims[2];
    (0..limit.min(dims[0]))
        .map(|i| data[16 + i * size..16 + (i + 1) * size].iter().map(|&b| b as f64 / 255.0).collect())
        .collect()
}
