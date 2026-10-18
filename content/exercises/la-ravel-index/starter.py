def ravel_index(index: list[int], shape: list[int]) -> int:
    """Return the position of `index` in the flat, row-major data of a tensor.

    ravel_index([1, 2], [2, 3]) == 5     # row 1, column 2 of a 2×3 matrix

    Raise IndexError (or ValueError) if index has the wrong number of
    entries or any entry is out of range for its axis.

    Tip: your `strides` function is available.
    """
    # TODO
    raise NotImplementedError
