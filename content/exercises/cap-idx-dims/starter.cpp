#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <vector>

// Read the header of an IDX file and return its dimensions.
//
// Layout: byte 0 and byte 1 are 0; byte 2 is the data type (must be 0x08, unsigned bytes);
// byte 3 is the number of dimensions d; then d big-endian u32 sizes; then the data.
//
// Signal an error if the magic bytes are wrong or the file's length doesn't equal
// 4 + 4*d + (product of the sizes): a truncated or corrupt file.
// Tip: read_u32_be is in your library.
std::vector<std::size_t> idx_dims(const std::vector<std::uint8_t>& data) {
    // TODO
    throw std::logic_error("not implemented");
}
