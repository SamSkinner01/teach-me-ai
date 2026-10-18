pub fn confusion_matrix(predicted: &[usize], actual: &[usize], classes: usize) -> Vec<Vec<f64>> {
    assert_eq!(predicted.len(), actual.len(), "one prediction per example");
    let mut m = vec![vec![0.0; classes]; classes];
    for (&p, &a) in predicted.iter().zip(actual) {
        assert!(p < classes && a < classes, "class out of range");
        m[a][p] += 1.0;
    }
    m
}
