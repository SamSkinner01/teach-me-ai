/// Return n standard-normal random numbers (mean 0, variance 1) using
/// the Box–Muller transform on uniforms from random_uniforms(seed, ...).
///
/// Use the uniforms in pairs (u1, u2) = (u[0], u[1]), (u[2], u[3]), ...
/// Each pair gives two normals, in this order:
///     r = sqrt(-2 ln u1), theta = 2 pi u2
///     r * cos(theta), r * sin(theta)
/// If n is odd, drop the final one.
///
/// Tip: `random_uniforms` is in your library; π is std::f64::consts::PI.
pub fn random_normals(seed: usize, n: usize) -> Vec<f64> {
    // TODO
    todo!()
}
