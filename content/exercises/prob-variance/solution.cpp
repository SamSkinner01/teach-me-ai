#include <vector>

double variance(const std::vector<double>& v) {
    double m = mean(v);
    double total = 0.0;
    for (double x : v) {
        total += (x - m) * (x - m);
    }
    return total / static_cast<double>(v.size());
}
