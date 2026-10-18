pub fn vec_scale(v: &[f64], s: f64) -> Vec<f64> {
    v.iter().map(|x| s * x).collect()
}
