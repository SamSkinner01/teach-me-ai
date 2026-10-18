/// Return the row-major (C-order) strides for a tensor of this shape.
///
/// strides[i] is how many elements you skip in the flat data to move
/// one step along axis i.
///
/// strides(&[2, 3]) == vec![3, 1]
/// strides(&[2, 3, 4]) == vec![12, 4, 1]
/// strides(&[]) == vec![]
pub fn strides(shape: &[usize]) -> Vec<usize> {
    // TODO
    todo!()
}
