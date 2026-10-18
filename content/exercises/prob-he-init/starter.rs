/// Return a fan_out × fan_in weight matrix with He initialization:
/// standard normals (from random_normals(seed, fan_out * fan_in), filled
/// row by row) scaled by sqrt(2 / fan_in).
///
/// Tip: `random_normals`, `vec_scale` and `reshape` are in your library.
pub fn he_init(seed: usize, fan_in: usize, fan_out: usize) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
