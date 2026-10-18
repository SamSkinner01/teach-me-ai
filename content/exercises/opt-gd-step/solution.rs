pub fn gd_step(w: &[f64], grad: &[f64], lr: f64) -> Vec<f64> {
    vec_add(w, &vec_scale(grad, -lr))
}
