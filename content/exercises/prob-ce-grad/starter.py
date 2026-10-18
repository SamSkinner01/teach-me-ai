def cross_entropy_grad(logits: list[float], label: int) -> list[float]:
    """Return the gradient of cross_entropy_loss(logits, label) with respect
    to each logit:  softmax(logits) - onehot(label).

    cross_entropy_grad([0.0, 0.0], 0) == [-0.5, 0.5]

    Raise IndexError (or ValueError) if label is out of range.
    Tip: `softmax` is in your library.
    """
    # TODO
    raise NotImplementedError
