pub fn argmax(v: &[f64]) -> usize {
    assert!(!v.is_empty(), "argmax of an empty vector");
    let mut best = 0;
    for i in 1..v.len() {
        if v[i] > v[best] {
            best = i;
        }
    }
    best
}
