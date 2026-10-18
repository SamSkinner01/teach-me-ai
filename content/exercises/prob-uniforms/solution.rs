pub fn random_uniforms(seed: usize, n: usize) -> Vec<f64> {
    assert!(seed >= 1 && seed <= u32::MAX as usize, "seed must be between 1 and 2^32 - 1");
    let mut state = seed;
    let mut out = Vec::with_capacity(n);
    for _ in 0..n {
        state = xorshift32(state);
        out.push(state as f64 / 4294967296.0);
    }
    out
}
