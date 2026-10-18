pub fn standardize(images: &[Vec<f64>], mean: f64, std: f64) -> Vec<Vec<f64>> {
    assert!(std > 0.0, "std must be positive");
    images.iter().map(|row| row.iter().map(|x| (x - mean) / std).collect()).collect()
}
