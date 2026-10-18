#include <stdexcept>
#include <vector>

// Return the matrix-vector product m · v.
//
// m is a vector of rows. Entry i of the result is (row i of m) · v.
//
// mat_vec({{1, 2}, {3, 4}}, {1, 1}) == {3.0, 7.0}
//
// Throw std::invalid_argument if the number of columns of m differs from v.size().
std::vector<double> mat_vec(const std::vector<std::vector<double>>& m, const std::vector<double>& v) {
    // TODO
    throw std::logic_error("not implemented");
}
