/// Train the capstone CNN on MNIST and return its accuracy on the test images.
///
/// Architecture: conv (8 filters, 3x3) -> relu -> 2x2 max-pool -> flatten (1352) -> dense (10).
///
/// Besides your library you can call:
///     report_progress(epoch, step, total_steps, loss, accuracy)   feeds the live dashboard
///     report_predictions(&predicted)       one predicted label per test image, in order
///     save_tensor(name, &shape, &values)   hands back your trained weights
pub fn train_cnn(data_dir: &str, train_limit: usize, test_limit: usize, epochs: usize, lr: f64, batch_size: usize, seed: usize) -> f64 {
    let read = |name: &str| std::fs::read(format!("{}/{}", data_dir, name)).expect("could not read an MNIST file");

    // 1. Load the data and standardize it with the MNIST mean (0.1307) and std (0.3081).
    let train_x = standardize(&idx_images(&read("train-images-idx3-ubyte"), train_limit), 0.1307, 0.3081);
    let train_y = idx_labels(&read("train-labels-idx1-ubyte"), train_limit);
    let test_x = standardize(&idx_images(&read("t10k-images-idx3-ubyte"), test_limit), 0.1307, 0.3081);
    let test_y = idx_labels(&read("t10k-labels-idx1-ubyte"), test_limit);

    // 2. Initialize the parameters.
    let shape = [1usize, 28, 28];
    let conv_shape = [8usize, 1, 3, 3];
    let mut conv_w = vec_scale(&random_normals(seed, 72), (2.0f64 / 9.0).sqrt()); // He init for 3x3 filters
    let mut conv_b = vec![0.0; 8];
    let mut dense_w = he_init(seed + 1, 8 * 13 * 13, 10); // 10 x 1352
    let mut dense_b = vec![0.0; 10];

    // 3. Train. For each epoch, shuffle with shuffled_indices(seed + epoch, n), then for each
    //    mini-batch (order.chunks(batch_size)): average cnn_gradients over the batch and take
    //    one gd_step per parameter. Call report_progress(...) after each step.
    // TODO

    // 4. Evaluate: predict every test image (argmax of cnn_forward) and report_predictions(...).
    // TODO

    // 5. Save the trained weights (the browser uses these names and shapes):
    //    save_tensor("conv1.w", &[8, 1, 3, 3], &conv_w), save_tensor("conv1.b", &[8], &conv_b),
    //    save_tensor("dense.w", &[10, 1352], &flatten(&dense_w)), save_tensor("dense.b", &[10], &dense_b)
    // TODO

    // 6. Return the fraction of test images predicted correctly.
    todo!()
}
