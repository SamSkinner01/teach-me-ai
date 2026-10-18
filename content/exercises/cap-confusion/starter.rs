/// Count predictions by true class (rows) and predicted class (columns):
/// result[actual][predicted] = number of examples with that pair. Returns a classes x classes
/// matrix of counts; the diagonal holds the correct predictions.
///
/// Signal an error if the lists differ in length or contain a class >= classes.
pub fn confusion_matrix(predicted: &[usize], actual: &[usize], classes: usize) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
