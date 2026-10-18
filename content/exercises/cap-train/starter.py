import math


def train_cnn(data_dir: str, train_limit: int, test_limit: int, epochs: int, lr: float,
              batch_size: int, seed: int) -> float:
    """Train the capstone CNN on MNIST and return its accuracy on the test images.

    Architecture: conv (8 filters, 3x3) -> relu -> 2x2 max-pool -> flatten (1352) -> dense (10).

    Besides your library you can call:
        report_progress(epoch, step, total_steps, loss, accuracy)   feeds the live dashboard
        report_predictions(predicted)    one predicted label per test image, in order
        save_tensor(name, shape, values) hands back your trained weights
    """
    def read(name):
        with open(f"{data_dir}/{name}", "rb") as f:
            return f.read()

    # 1. Load the data and standardize it with the MNIST mean (0.1307) and std (0.3081).
    train_x = standardize(idx_images(read("train-images-idx3-ubyte"), train_limit), 0.1307, 0.3081)
    train_y = idx_labels(read("train-labels-idx1-ubyte"), train_limit)
    test_x = standardize(idx_images(read("t10k-images-idx3-ubyte"), test_limit), 0.1307, 0.3081)
    test_y = idx_labels(read("t10k-labels-idx1-ubyte"), test_limit)

    # 2. Initialize the parameters.
    shape = [1, 28, 28]
    conv_shape = [8, 1, 3, 3]
    conv_w = vec_scale(random_normals(seed, 72), math.sqrt(2.0 / 9))   # He init for 3x3 filters
    conv_b = [0.0] * 8
    dense_w = he_init(seed + 1, 8 * 13 * 13, 10)                       # 10 x 1352
    dense_b = [0.0] * 10

    # 3. Train. For each epoch, shuffle with shuffled_indices(seed + epoch, n), then for each
    #    mini-batch: average cnn_gradients over the batch and take one gd_step per parameter.
    #    Call report_progress(epoch, step, total_steps, batch_loss, batch_accuracy) after each step.
    # TODO

    # 4. Evaluate: predict every test image (argmax of cnn_forward) and report_predictions(...).
    # TODO

    # 5. Save the trained weights (the browser uses these names and shapes):
    #    save_tensor("conv1.w", [8, 1, 3, 3], conv_w), save_tensor("conv1.b", [8], conv_b),
    #    save_tensor("dense.w", [10, 1352], flatten(dense_w)), save_tensor("dense.b", [10], dense_b)
    # TODO

    # 6. Return the fraction of test images predicted correctly.
    raise NotImplementedError
