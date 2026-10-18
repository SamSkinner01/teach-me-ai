pub fn read_u32_be(data: &[u8], offset: usize) -> usize {
    assert!(offset + 4 <= data.len(), "not enough bytes");
    let b = |i: usize| data[offset + i] as usize;
    (b(0) << 24) | (b(1) << 16) | (b(2) << 8) | b(3)
}
