#include <cmath>
#include <cstddef>
#include <cstdint>
#include <fstream>
#include <iterator>
#include <stdexcept>
#include <string>
#include <vector>

static std::vector<std::uint8_t> read_mnist_file(const std::string& path) {
    std::ifstream f(path, std::ios::binary);
    if (!f) throw std::runtime_error("could not read " + path);
    return std::vector<std::uint8_t>(std::istreambuf_iterator<char>(f), std::istreambuf_iterator<char>());
}

double train_cnn(const std::string& data_dir, std::size_t train_limit, std::size_t test_limit, std::size_t epochs,
                 double lr, std::size_t batch_size, std::size_t seed) {
    const double mean = 0.1307, std_dev = 0.3081;
    auto train_x = standardize(idx_images(read_mnist_file(data_dir + "/train-images-idx3-ubyte"), train_limit), mean, std_dev);
    auto train_y = idx_labels(read_mnist_file(data_dir + "/train-labels-idx1-ubyte"), train_limit);
    auto test_x = standardize(idx_images(read_mnist_file(data_dir + "/t10k-images-idx3-ubyte"), test_limit), mean, std_dev);
    auto test_y = idx_labels(read_mnist_file(data_dir + "/t10k-labels-idx1-ubyte"), test_limit);

    const std::vector<std::size_t> shape = {1, 28, 28};
    const std::size_t filters = 8, flat_size = filters * 13 * 13;
    const std::vector<std::size_t> conv_shape = {filters, 1, 3, 3};
    std::vector<double> conv_w = vec_scale(random_normals(seed, filters * 9), std::sqrt(2.0 / 9.0));
    std::vector<double> conv_b(filters, 0.0);
    std::vector<std::vector<double>> dense_w = he_init(seed + 1, flat_size, 10);
    std::vector<double> dense_b(10, 0.0);
    const std::size_t a = filters * 9, b = filters * 10, c = filters * 10 + 10 * flat_size;

    const std::size_t n = train_x.size();
    const std::size_t steps = (n + batch_size - 1) / batch_size;
    for (std::size_t epoch = 0; epoch < epochs; ++epoch) {
        std::vector<std::size_t> order = shuffled_indices(seed + epoch, n);
        for (std::size_t step = 0; step < steps; ++step) {
            std::size_t start = step * batch_size, end = std::min(n, start + batch_size);
            std::vector<double> total(c + 10, 0.0);
            double loss = 0.0;
            std::size_t correct = 0;
            for (std::size_t k = start; k < end; ++k) {
                std::size_t i = order[k];
                std::vector<double> logits = cnn_forward(train_x[i], shape, conv_w, conv_shape, conv_b, dense_w, dense_b);
                loss += cross_entropy_loss(logits, train_y[i]);
                if (argmax(logits) == train_y[i]) ++correct;
                total = vec_add(total, cnn_gradients(train_x[i], shape, train_y[i], conv_w, conv_shape, conv_b, dense_w, dense_b));
            }
            double count = static_cast<double>(end - start);
            std::vector<double> g = vec_scale(total, 1.0 / count);
            conv_w = gd_step(conv_w, std::vector<double>(g.begin(), g.begin() + a), lr);
            conv_b = gd_step(conv_b, std::vector<double>(g.begin() + a, g.begin() + b), lr);
            dense_w = reshape(gd_step(flatten(dense_w), std::vector<double>(g.begin() + b, g.begin() + c), lr), 10, flat_size);
            dense_b = gd_step(dense_b, std::vector<double>(g.begin() + c, g.end()), lr);
            report_progress(epoch, step + 1, steps, loss / count, correct / count);
        }
    }

    std::vector<std::size_t> predicted;
    std::size_t right = 0;
    for (std::size_t i = 0; i < test_x.size(); ++i) {
        predicted.push_back(argmax(cnn_forward(test_x[i], shape, conv_w, conv_shape, conv_b, dense_w, dense_b)));
        if (predicted.back() == test_y[i]) ++right;
    }
    report_predictions(predicted);
    save_tensor("conv1.w", conv_shape, conv_w);
    save_tensor("conv1.b", {filters}, conv_b);
    save_tensor("dense.w", {10, flat_size}, flatten(dense_w));
    save_tensor("dense.b", {10}, dense_b);
    return static_cast<double>(right) / static_cast<double>(test_y.size());
}
