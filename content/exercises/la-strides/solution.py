def strides(shape: list[int]) -> list[int]:
    result = [0] * len(shape)
    step = 1
    for i in range(len(shape) - 1, -1, -1):
        result[i] = step
        step *= shape[i]
    return result
