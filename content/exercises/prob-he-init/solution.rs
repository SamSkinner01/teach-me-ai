pub fn he_init(seed: usize, fan_in: usize, fan_out: usize) -> Vec<Vec<f64>> {
    let z = random_normals(seed, fan_in * fan_out);
    let scale = (2.0 / fan_in as f64).sqrt();
    reshape(&vec_scale(&z, scale), fan_out, fan_in)
}
