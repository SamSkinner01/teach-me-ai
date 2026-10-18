pub fn strides(shape: &[usize]) -> Vec<usize> {
    let mut result = vec![0; shape.len()];
    let mut step = 1;
    for i in (0..shape.len()).rev() {
        result[i] = step;
        step *= shape[i];
    }
    result
}
