def matmul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    """Return the matrix product a @ b.

    If a is n×k and b is k×m, the result is n×m and
    result[i][j] = sum over t of a[i][t] * b[t][j].

    matmul([[1, 2], [3, 4]], [[5, 6], [7, 8]]) == [[19, 22], [43, 50]]

    Raise ValueError if the number of columns of a differs from the
    number of rows of b.
    """
    # TODO
    raise NotImplementedError
