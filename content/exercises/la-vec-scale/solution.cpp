#include <vector>

std::vector<double> vec_scale(const std::vector<double>& v, double s) {
    std::vector<double> out;
    out.reserve(v.size());
    for (double x : v) {
        out.push_back(s * x);
    }
    return out;
}
