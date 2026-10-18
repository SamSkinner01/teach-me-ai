def train_mlp(xs: list[list[float]], labels: list[int], hidden: int, classes: int,
              lr: float, epochs: int, seed: int) -> float:
    w1 = he_init(seed, len(xs[0]), hidden)
    b1 = [0.0] * hidden
    w2 = he_init(seed + 1, hidden, classes)
    b2 = [0.0] * classes
    for _ in range(epochs):
        z1 = dense_forward(xs, w1, b1)
        h = [relu(row) for row in z1]
        logits = dense_forward(h, w2, b2)
        d_logits = batch_cross_entropy_grad(logits, labels)
        dw2 = dense_backward_weights(d_logits, h)
        db2 = dense_backward_bias(d_logits)
        dh = dense_backward_input(d_logits, w2)
        dz1 = [relu_backward(z, g) for z, g in zip(z1, dh)]
        dw1 = dense_backward_weights(dz1, xs)
        db1 = dense_backward_bias(dz1)
        w1 = [gd_step(row, g, lr) for row, g in zip(w1, dw1)]
        b1 = gd_step(b1, db1, lr)
        w2 = [gd_step(row, g, lr) for row, g in zip(w2, dw2)]
        b2 = gd_step(b2, db2, lr)
    return batch_cross_entropy(mlp_forward(xs, w1, b1, w2, b2), labels)
