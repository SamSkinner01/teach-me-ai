pub fn conv_output_size(n: usize, k: usize, stride: usize, padding: usize) -> usize {
    assert!(stride > 0 && k <= n + 2 * padding, "stride must be positive and the kernel must fit");
    (n + 2 * padding - k) / stride + 1
}
