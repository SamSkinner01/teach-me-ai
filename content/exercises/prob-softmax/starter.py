import math


def softmax(logits: list[float]) -> list[float]:
    """Turn a vector of scores (logits) into probabilities:

        softmax(z)[i] = exp(z[i]) / sum_j exp(z[j])

    softmax([0.0, 0.0]) == [0.5, 0.5]

    It must work for huge scores like [1000, 1001, 1002] too.
    Tip: `vec_sum` and `vec_scale` are in your library.
    """
    # TODO
    raise NotImplementedError
