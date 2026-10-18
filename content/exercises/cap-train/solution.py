import math


def train_cnn(data_dir: str, train_limit: int, test_limit: int, epochs: int, lr: float,
              batch_size: int, seed: int) -> float:
    def read(name):
        with open(f"{data_dir}/{name}", "rb") as f:
            return f.read()

    mean, std = 0.1307, 0.3081
    train_x = standardize(idx_images(read("train-images-idx3-ubyte"), train_limit), mean, std)
    train_y = idx_labels(read("train-labels-idx1-ubyte"), train_limit)
    test_x = standardize(idx_images(read("t10k-images-idx3-ubyte"), test_limit), mean, std)
    test_y = idx_labels(read("t10k-labels-idx1-ubyte"), test_limit)

    shape = [1, 28, 28]
    filters = 8
    conv_shape = [filters, 1, 3, 3]
    conv_w = vec_scale(random_normals(seed, filters * 9), math.sqrt(2.0 / 9))
    conv_b = [0.0] * filters
    dense_w = he_init(seed + 1, filters * 13 * 13, 10)
    dense_b = [0.0] * 10
    sizes = [len(conv_w), len(conv_b), len(dense_w) * len(dense_w[0]), len(dense_b)]

    n = len(train_x)
    steps = (n + batch_size - 1) // batch_size
    for epoch in range(epochs):
        order = shuffled_indices(seed + epoch, n)
        for step in range(steps):
            batch = order[step * batch_size:(step + 1) * batch_size]
            total = [0.0] * sum(sizes)
            loss = 0.0
            correct = 0
            for i in batch:
                logits = cnn_forward(train_x[i], shape, conv_w, conv_shape, conv_b, dense_w, dense_b)
                loss += cross_entropy_loss(logits, train_y[i])
                correct += argmax(logits) == train_y[i]
                total = vec_add(total, cnn_gradients(train_x[i], shape, train_y[i], conv_w, conv_shape, conv_b, dense_w, dense_b))
            g = vec_scale(total, 1.0 / len(batch))
            a, b, c = sizes[0], sizes[0] + sizes[1], sizes[0] + sizes[1] + sizes[2]
            conv_w = gd_step(conv_w, g[:a], lr)
            conv_b = gd_step(conv_b, g[a:b], lr)
            flat_w = gd_step(flatten(dense_w), g[b:c], lr)
            dense_w = reshape(flat_w, 10, len(flat_w) // 10)
            dense_b = gd_step(dense_b, g[c:], lr)
            report_progress(epoch, step + 1, steps, loss / len(batch), correct / len(batch))

    predicted = [argmax(cnn_forward(x, shape, conv_w, conv_shape, conv_b, dense_w, dense_b)) for x in test_x]
    report_predictions(predicted)
    save_tensor("conv1.w", conv_shape, conv_w)
    save_tensor("conv1.b", [filters], conv_b)
    save_tensor("dense.w", [10, filters * 13 * 13], flatten(dense_w))
    save_tensor("dense.b", [10], dense_b)
    return sum(1 for p, y in zip(predicted, test_y) if p == y) / len(test_y)
