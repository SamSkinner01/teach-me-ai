pub fn sgd_fit_line(xs: &[f64], ys: &[f64], lr: f64, epochs: usize, batch_size: usize, seed: usize) -> Vec<f64> {
    assert_eq!(xs.len(), ys.len(), "need one y per x");
    let n = xs.len();
    let (mut w, mut b) = (0.0, 0.0);
    for e in 0..epochs {
        let order = shuffled_indices(seed + e, n);
        for batch in order.chunks(batch_size) {
            let bx: Vec<f64> = batch.iter().map(|&i| xs[i]).collect();
            let by: Vec<f64> = batch.iter().map(|&i| ys[i]).collect();
            let pred: Vec<f64> = bx.iter().map(|x| w * x + b).collect();
            let g = mse_grad(&pred, &by);
            w -= lr * dot(&g, &bx);
            b -= lr * vec_sum(&g);
        }
    }
    vec![w, b]
}
