#include <cmath>

double sigmoid(double x) {
    if (x >= 0.0) {
        return 1.0 / (1.0 + std::exp(-x));
    }
    double e = std::exp(x);
    return e / (1.0 + e);
}
