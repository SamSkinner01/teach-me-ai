pub fn xorshift32(state: usize) -> usize {
    let mut x = state as u32;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    x as usize
}
