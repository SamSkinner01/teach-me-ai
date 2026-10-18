/// A dense (fully connected) layer applied to a batch.
/// x is N x in (one example per row), w is out x in (one neuron per row), b has `out` entries.
/// Return x · wᵀ + b: an N x out matrix whose row i is the layer's output for example i.
///
/// Tip: matmul, transpose and add_bias are in your library.
pub fn dense_forward(x: &[Vec<f64>], w: &[Vec<f64>], b: &[f64]) -> Vec<Vec<f64>> {
    // TODO
    todo!()
}
