#include <vector>

double relative_error(const std::vector<double>& a, const std::vector<double>& b) {
    std::vector<double> diff = vec_add(a, vec_scale(b, -1.0));
    double denom = norm(a) + norm(b);
    if (denom == 0.0) {
        return 0.0;
    }
    return norm(diff) / denom;
}
