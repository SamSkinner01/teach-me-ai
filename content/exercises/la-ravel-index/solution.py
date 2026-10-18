def ravel_index(index: list[int], shape: list[int]) -> int:
    if len(index) != len(shape):
        raise ValueError(f"index has {len(index)} entries but the tensor has {len(shape)} axes")
    for i, (idx, size) in enumerate(zip(index, shape)):
        if not 0 <= idx < size:
            raise IndexError(f"index {idx} is out of range for axis {i} of size {size}")
    flat = 0
    for idx, stride in zip(index, strides(shape)):
        flat += idx * stride
    return flat
