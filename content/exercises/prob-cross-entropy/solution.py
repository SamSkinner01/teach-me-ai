def cross_entropy_loss(logits: list[float], label: int) -> float:
    if not 0 <= label < len(logits):
        raise IndexError(f"label {label} is out of range for {len(logits)} classes")
    return log_sum_exp(logits) - logits[label]
