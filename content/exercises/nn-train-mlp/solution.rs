pub fn train_mlp(xs: &[Vec<f64>], labels: &[usize], hidden: usize, classes: usize, lr: f64, epochs: usize, seed: usize) -> f64 {
    let mut w1 = he_init(seed, xs[0].len(), hidden);
    let mut b1 = vec![0.0; hidden];
    let mut w2 = he_init(seed + 1, hidden, classes);
    let mut b2 = vec![0.0; classes];
    for _ in 0..epochs {
        let z1 = dense_forward(xs, &w1, &b1);
        let h: Vec<Vec<f64>> = z1.iter().map(|row| relu(row)).collect();
        let logits = dense_forward(&h, &w2, &b2);
        let d_logits = batch_cross_entropy_grad(&logits, labels);
        let dw2 = dense_backward_weights(&d_logits, &h);
        let db2 = dense_backward_bias(&d_logits);
        let dh = dense_backward_input(&d_logits, &w2);
        let dz1: Vec<Vec<f64>> = z1.iter().zip(&dh).map(|(z, g)| relu_backward(z, g)).collect();
        let dw1 = dense_backward_weights(&dz1, xs);
        let db1 = dense_backward_bias(&dz1);
        w1 = w1.iter().zip(&dw1).map(|(row, g)| gd_step(row, g, lr)).collect();
        b1 = gd_step(&b1, &db1, lr);
        w2 = w2.iter().zip(&dw2).map(|(row, g)| gd_step(row, g, lr)).collect();
        b2 = gd_step(&b2, &db2, lr);
    }
    batch_cross_entropy(&mlp_forward(xs, &w1, &b1, &w2, &b2), labels)
}
