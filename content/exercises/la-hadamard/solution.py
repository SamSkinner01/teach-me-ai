def hadamard(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    if len(a) != len(b) or any(len(ra) != len(rb) for ra, rb in zip(a, b)):
        raise ValueError("hadamard product needs matrices of the same shape")
    return [[x * y for x, y in zip(ra, rb)] for ra, rb in zip(a, b)]
