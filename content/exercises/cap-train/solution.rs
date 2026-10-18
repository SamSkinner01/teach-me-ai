pub fn train_cnn(data_dir: &str, train_limit: usize, test_limit: usize, epochs: usize, lr: f64, batch_size: usize, seed: usize) -> f64 {
    let read = |name: &str| std::fs::read(format!("{}/{}", data_dir, name)).expect("could not read an MNIST file");
    let (mean, std) = (0.1307, 0.3081);
    let train_x = standardize(&idx_images(&read("train-images-idx3-ubyte"), train_limit), mean, std);
    let train_y = idx_labels(&read("train-labels-idx1-ubyte"), train_limit);
    let test_x = standardize(&idx_images(&read("t10k-images-idx3-ubyte"), test_limit), mean, std);
    let test_y = idx_labels(&read("t10k-labels-idx1-ubyte"), test_limit);

    let shape = [1usize, 28, 28];
    let filters = 8;
    let conv_shape = [filters, 1, 3, 3];
    let mut conv_w = vec_scale(&random_normals(seed, filters * 9), (2.0f64 / 9.0).sqrt());
    let mut conv_b = vec![0.0; filters];
    let mut dense_w = he_init(seed + 1, filters * 13 * 13, 10);
    let mut dense_b = vec![0.0; 10];
    let (a, b, c) = (filters * 9, filters * 10, filters * 10 + 10 * filters * 13 * 13);

    let n = train_x.len();
    let steps = (n + batch_size - 1) / batch_size;
    for epoch in 0..epochs {
        let order = shuffled_indices(seed + epoch, n);
        for (step, batch) in order.chunks(batch_size).enumerate() {
            let mut total = vec![0.0; c + 10];
            let (mut loss, mut correct) = (0.0, 0usize);
            for &i in batch {
                let logits = cnn_forward(&train_x[i], &shape, &conv_w, &conv_shape, &conv_b, &dense_w, &dense_b);
                loss += cross_entropy_loss(&logits, train_y[i]);
                if argmax(&logits) == train_y[i] {
                    correct += 1;
                }
                let g = cnn_gradients(&train_x[i], &shape, train_y[i], &conv_w, &conv_shape, &conv_b, &dense_w, &dense_b);
                total = vec_add(&total, &g);
            }
            let g = vec_scale(&total, 1.0 / batch.len() as f64);
            conv_w = gd_step(&conv_w, &g[..a], lr);
            conv_b = gd_step(&conv_b, &g[a..b], lr);
            dense_w = reshape(&gd_step(&flatten(&dense_w), &g[b..c], lr), 10, filters * 13 * 13);
            dense_b = gd_step(&dense_b, &g[c..], lr);
            report_progress(epoch, step + 1, steps, loss / batch.len() as f64, correct as f64 / batch.len() as f64);
        }
    }

    let predicted: Vec<usize> = test_x
        .iter()
        .map(|x| argmax(&cnn_forward(x, &shape, &conv_w, &conv_shape, &conv_b, &dense_w, &dense_b)))
        .collect();
    report_predictions(&predicted);
    save_tensor("conv1.w", &conv_shape, &conv_w);
    save_tensor("conv1.b", &[filters], &conv_b);
    save_tensor("dense.w", &[10, filters * 13 * 13], &flatten(&dense_w));
    save_tensor("dense.b", &[10], &dense_b);
    let right = predicted.iter().zip(&test_y).filter(|(p, y)| p == y).count();
    right as f64 / test_y.len() as f64
}
