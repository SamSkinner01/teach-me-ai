pub fn idx_dims(data: &[u8]) -> Vec<usize> {
    assert!(data.len() >= 4 && data[0] == 0 && data[1] == 0 && data[2] == 8, "not an unsigned-byte IDX file");
    let nd = data[3] as usize;
    let dims: Vec<usize> = (0..nd).map(|i| read_u32_be(data, 4 + 4 * i)).collect();
    let total: usize = dims.iter().product();
    assert_eq!(data.len(), 4 + 4 * nd + total, "the file is truncated or has extra bytes");
    dims
}
