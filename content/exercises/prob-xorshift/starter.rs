/// Advance Marsaglia's xorshift32 generator by one step and return the new state.
///
///     x ^= x << 13
///     x ^= x >> 17
///     x ^= x << 5
///
/// All arithmetic is on 32-bit unsigned integers, so bits shifted past
/// bit 31 are discarded. Convert with `state as u32`, and back with `x as usize`.
///
/// xorshift32(1) == 270369
pub fn xorshift32(state: usize) -> usize {
    // TODO
    todo!()
}
