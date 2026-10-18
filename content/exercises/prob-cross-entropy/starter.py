def cross_entropy_loss(logits: list[float], label: int) -> float:
    """Return the cross-entropy loss -ln(softmax(logits)[label]):
    how surprised the model is that the true class is `label`.

    cross_entropy_loss([0.0, 0.0], 0) == math.log(2)

    Compute it stably (it must be finite for logits like [1000, 0]).
    Raise IndexError (or ValueError) if label is out of range.
    Tip: `log_sum_exp` is in your library.
    """
    # TODO
    raise NotImplementedError
