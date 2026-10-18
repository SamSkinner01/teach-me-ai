import math

from app.runner.grading import DEFAULT_TOLERANCE, compare

TOL = DEFAULT_TOLERANCE


def test_float_tolerance():
    assert compare("float", 1.0, 1.0 + 1e-12, TOL)[0]
    assert not compare("float", 1.0, 1.1, TOL)[0]
    assert compare("float", 5, 5, TOL)[0]  # ints are fine for floats
    assert compare("float", math.nan, math.nan, TOL)[0]
    assert not compare("float", 1.0, math.nan, TOL)[0]
    assert compare("float", math.inf, math.inf, TOL)[0]


def test_float_rejects_wrong_types():
    ok, why = compare("float", 1.0, [1.0], TOL)
    assert not ok and "number" in why
    ok, why = compare("float", 1.0, True, TOL)
    assert not ok


def test_vec_length_and_element_messages():
    ok, why = compare("vec", [1.0, 2.0], [1.0], TOL)
    assert not ok and "length 2" in why and "length 1" in why
    ok, why = compare("vec", [1.0, 2.0], [1.0, 3.0], TOL)
    assert not ok and "[1]" in why


def test_mat_shape_messages():
    ok, why = compare("mat", [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], [[1.0, 2.0], [3.0, 4.0]], TOL)
    assert not ok and "2×3" in why and "2×2" in why
    ok, why = compare("mat", [[1.0, 2.0], [3.0, 4.0]], [[1.0, 2.0], [3.0]], TOL)
    assert not ok and "ragged" in why
    ok, why = compare("mat", [[1.0, 2.0], [3.0, 4.0]], [[1.0, 2.0], [3.0, 5.0]], TOL)
    assert not ok and "[1][1]" in why
    assert compare("mat", [], [], TOL)[0]


def test_int_and_ivec():
    assert compare("int", 5, 5, TOL)[0]
    assert compare("int", 5, 5.0, TOL)[0]
    assert not compare("int", 5, 5.5, TOL)[0]
    assert compare("ivec", [3, 1], [3, 1], TOL)[0]
    assert not compare("ivec", [3, 1], [1, 3], TOL)[0]
