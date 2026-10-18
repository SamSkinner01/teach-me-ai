def accuracy(logits: list[list[float]], labels: list[int]) -> float:
    """Return the fraction of rows whose largest logit is at the correct label
(argmax(logits[i]) == labels[i]), between 0 and 1.

Signal an error if there isn't exactly one label per row (or the batch is empty).
    """
    # TODO
    raise NotImplementedError
