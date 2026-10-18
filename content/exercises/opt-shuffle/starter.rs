/// Return a random permutation of [0, 1, ..., n-1] using the Fisher–Yates shuffle:
///
///     idx = [0, 1, ..., n-1]; state = seed
///     for i from n-1 down to 1:
///         state = xorshift32(state)
///         j = state % (i + 1)
///         swap idx[i] and idx[j]       (Vec has a .swap(i, j) method)
///
/// Panic unless 1 <= seed <= 2^32 - 1.
pub fn shuffled_indices(seed: usize, n: usize) -> Vec<usize> {
    // TODO
    todo!()
}
