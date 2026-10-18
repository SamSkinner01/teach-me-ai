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

// Train the capstone CNN on MNIST and return its accuracy on the test images.
//
// Architecture: conv (8 filters, 3x3) -> relu -> 2x2 max-pool -> flatten (1352) -> dense (10).
//
// Besides your library you can call:
//     report_progress(epoch, step, total_steps, loss, accuracy)   feeds the live dashboard
//     report_predictions(predicted)       one predicted label per test image, in order
//     save_tensor(name, shape, values)    hands back your trained weights
double train_cnn(const std::string& data_dir, std::size_t train_limit, std::size_t test_limit, std::size_t epochs,
                 double lr, std::size_t batch_size, std::size_t seed) {
    // 1. Load the data and standardize it with the MNIST mean (0.1307) and std (0.3081).
    auto train_x = standardize(idx_images(read_mnist_file(data_dir + "/train-images-idx3-ubyte"), train_limit), 0.1307, 0.3081);
    auto train_y = idx_labels(read_mnist_file(data_dir + "/train-labels-idx1-ubyte"), train_limit);
    auto test_x = standardize(idx_images(read_mnist_file(data_dir + "/t10k-images-idx3-ubyte"), test_limit), 0.1307, 0.3081);
    auto test_y = idx_labels(read_mnist_file(data_dir + "/t10k-labels-idx1-ubyte"), test_limit);

    // 2. Initialize the parameters.
    const std::vector<std::size_t> shape = {1, 28, 28};
    const std::vector<std::size_t> conv_shape = {8, 1, 3, 3};
    std::vector<double> conv_w = vec_scale(random_normals(seed, 72), std::sqrt(2.0 / 9.0));  // He init, 3x3
    std::vector<double> conv_b(8, 0.0);
    std::vector<std::vector<double>> dense_w = he_init(seed + 1, 8 * 13 * 13, 10);  // 10 x 1352
    std::vector<double> dense_b(10, 0.0);

    // 3. Train. For each epoch, shuffle with shuffled_indices(seed + epoch, n), then for each
    //    mini-batch: average cnn_gradients over the batch and take one gd_step per parameter.
    //    Call report_progress(...) after each step.
    // TODO

    // 4. Evaluate: predict every test image (argmax of cnn_forward) and report_predictions(...).
    // TODO

    // 5. Save the trained weights (the browser uses these names and shapes):
    //    save_tensor("conv1.w", {8, 1, 3, 3}, conv_w), save_tensor("conv1.b", {8}, conv_b),
    //    save_tensor("dense.w", {10, 1352}, flatten(dense_w)), save_tensor("dense.b", {10}, dense_b)
    // TODO

    // 6. Return the fraction of test images predicted correctly.
    throw std::logic_error("not implemented");
}
