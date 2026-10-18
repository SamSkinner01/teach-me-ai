pub fn momentum_step(w: &[f64], velocity: &[f64], grad: &[f64], lr: f64, beta: f64) -> Vec<Vec<f64>> {
    let v_new = vec_add(&vec_scale(velocity, beta), grad);
    let w_new = vec_add(w, &vec_scale(&v_new, -lr));
    vec![w_new, v_new]
}
