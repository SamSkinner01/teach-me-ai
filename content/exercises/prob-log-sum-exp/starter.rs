/// Return ln(Σ_i exp(v[i])), computed without overflow or underflow.
///
/// log_sum_exp(&[0.0, 0.0]) == 2f64.ln()
/// log_sum_exp(&[1000.0, 1000.0]) == 1000.0 + 2f64.ln()
///
/// Panic if `v` is empty. Natural log is `x.ln()`.
pub fn log_sum_exp(v: &[f64]) -> f64 {
    // TODO
    todo!()
}
