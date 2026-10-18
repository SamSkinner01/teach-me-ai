pub fn shuffled_indices(seed: usize, n: usize) -> Vec<usize> {
    assert!(seed >= 1 && seed <= u32::MAX as usize, "seed must be between 1 and 2^32 - 1");
    let mut idx: Vec<usize> = (0..n).collect();
    let mut state = seed;
    for i in (1..n).rev() {
        state = xorshift32(state);
        let j = state % (i + 1);
        idx.swap(i, j);
    }
    idx
}
