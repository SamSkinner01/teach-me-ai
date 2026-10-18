def batch_cross_entropy(logits: list[list[float]], labels: list[int]) -> float:
    """Return the mean cross-entropy loss over a batch: the average over rows i of
cross_entropy_loss(logits[i], labels[i]).

Signal an error if there isn't exactly one label per row (or the batch is empty).
    """
    # TODO
    raise NotImplementedError
