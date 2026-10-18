pub fn fit_line(xs: &[f64], ys: &[f64], lr: f64, epochs: usize) -> Vec<f64> {
    assert_eq!(xs.len(), ys.len(), "need one y per x");
    let (mut w, mut b) = (0.0, 0.0);
    for _ in 0..epochs {
        let pred: Vec<f64> = xs.iter().map(|x| w * x + b).collect();
        let g = mse_grad(&pred, ys);
        w -= lr * dot(&g, xs);
        b -= lr * vec_sum(&g);
    }
    vec![w, b]
}
