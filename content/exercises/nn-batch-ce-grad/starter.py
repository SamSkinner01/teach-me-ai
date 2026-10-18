def batch_cross_entropy_grad(logits: list[list[float]], labels: list[int]) -> list[list[float]]:
    """Return the gradient of batch_cross_entropy(logits, labels) with respect to every logit:
row i is cross_entropy_grad(logits[i], labels[i]) divided by N (the number of rows),
because the loss is an average over the batch.

Signal an error if there isn't exactly one label per row (or the batch is empty).
    """
    # TODO
    raise NotImplementedError
