#include <vector>

double vec_sum(const std::vector<double>& v) {
    double total = 0.0;
    for (double x : v) {
        total += x;
    }
    return total;
}
