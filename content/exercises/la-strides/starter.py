def strides(shape: list[int]) -> list[int]:
    """Return the row-major (C-order) strides for a tensor of this shape.

    strides[i] is how many elements you skip in the flat data to move
    one step along axis i.

    strides([2, 3]) == [3, 1]
    strides([2, 3, 4]) == [12, 4, 1]
    strides([]) == []
    """
    # TODO
    raise NotImplementedError
