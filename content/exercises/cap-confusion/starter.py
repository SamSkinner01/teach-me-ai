def confusion_matrix(predicted: list[int], actual: list[int], classes: int) -> list[list[float]]:
    """Count predictions by true class (rows) and predicted class (columns):
result[actual][predicted] = number of examples with that pair. Returns a classes x classes
matrix of counts; the diagonal holds the correct predictions.

Signal an error if the lists differ in length or contain a class >= classes.
    """
    # TODO
    raise NotImplementedError
