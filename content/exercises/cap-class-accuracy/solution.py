def class_accuracy(confusion: list[list[float]]) -> list[float]:
    out = []
    for i, row in enumerate(confusion):
        total = vec_sum(row)
        out.append(row[i] / total if total > 0 else 0.0)
    return out
