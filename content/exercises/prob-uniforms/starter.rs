/// Return n pseudo-random numbers in (0, 1) from the xorshift32 generator.
///
/// state = seed; then n times: state = xorshift32(state) and output
/// state / 2^32 (as an f64).
///
/// Panic unless 1 <= seed <= 2^32 - 1.
/// Tip: `xorshift32` is in your library.
pub fn random_uniforms(seed: usize, n: usize) -> Vec<f64> {
    // TODO
    todo!()
}
