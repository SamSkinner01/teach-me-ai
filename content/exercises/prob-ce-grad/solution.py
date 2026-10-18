def cross_entropy_grad(logits: list[float], label: int) -> list[float]:
    if not 0 <= label < len(logits):
        raise IndexError(f"label {label} is out of range for {len(logits)} classes")
    grad = list(softmax(logits))
    grad[label] -= 1.0
    return grad
