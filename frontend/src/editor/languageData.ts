// What the editor knows about each language: keywords, the standard-library
// pieces the course uses, members after "." / "::", and snippets.
// Kept deliberately small and course-focused rather than exhaustive.

import type { Language } from "../api";

export interface Entry {
  name: string;
  /** Signature or short form shown next to the name. */
  detail: string;
  doc: string;
  /** Monaco snippet syntax; defaults to the name. */
  insert?: string;
  kind?: "function" | "method" | "keyword" | "type" | "constant" | "module" | "snippet" | "macro";
  /** Parameter labels for signature help. */
  params?: string[];
}

export interface LanguageData {
  keywords: string[];
  globals: Entry[];
  /** Members offered after `prefix` (e.g. "math." or "std::"). */
  namespaces: Record<string, Entry[]>;
  /** Members offered after "." on any value (types are unknown, so these are common ones). */
  members: Entry[];
  snippets: Entry[];
}

const fn = (name: string, params: string[], doc: string, extra: Partial<Entry> = {}): Entry => ({
  name,
  detail: `${name}(${params.join(", ")})`,
  doc,
  params,
  insert: params.length ? `${name}(${params.map((p, i) => `\${${i + 1}:${p.replace(/[=:].*$/, "").trim()}}`).join(", ")})` : `${name}()`,
  kind: "function",
  ...extra,
});

const method = (name: string, params: string[], doc: string): Entry => ({ ...fn(name, params, doc), kind: "method" });

const PYTHON: LanguageData = {
  keywords: ["def", "return", "for", "in", "while", "if", "elif", "else", "and", "or", "not", "is", "None", "True", "False", "raise", "import", "from", "as", "break", "continue", "pass", "lambda", "try", "except", "with", "assert"],
  globals: [
    fn("len", ["s"], "Number of items in a list (or characters in a string)."),
    fn("range", ["stop"], "Integers 0, 1, …, stop−1. Also range(start, stop) and range(start, stop, step)."),
    fn("sum", ["iterable"], "Adds up the numbers. Uses compensated summation for floats."),
    fn("min", ["a", "b"], "The smallest argument, or the smallest item of one list."),
    fn("max", ["a", "b"], "The largest argument, or the largest item of one list."),
    fn("abs", ["x"], "Absolute value."),
    fn("enumerate", ["iterable"], "Pairs (index, item): for i, x in enumerate(v): …"),
    fn("zip", ["a", "b"], "Pairs up items from several lists, stopping at the shortest: for x, y in zip(a, b): …"),
    fn("list", ["iterable"], "A new list (also a shallow copy: list(v))."),
    fn("float", ["x"], "Convert to a floating-point number. float('inf') is infinity."),
    fn("int", ["x"], "Convert to an integer (truncates towards zero)."),
    fn("round", ["x", "ndigits"], "Round to ndigits decimal places."),
    fn("sorted", ["iterable"], "A new sorted list."),
    fn("reversed", ["seq"], "Iterate backwards."),
    fn("any", ["iterable"], "True if any item is true."),
    fn("all", ["iterable"], "True if every item is true."),
    fn("print", ["value"], "Print to the program output (shown under the test results)."),
    fn("isinstance", ["obj", "type"], "Check a value's type."),
    { name: "ValueError", detail: "exception", doc: "Raise for bad input: raise ValueError(\"lengths differ\")", kind: "type", insert: 'ValueError("${1:message}")' },
    { name: "IndexError", detail: "exception", doc: "Raise for an index out of range.", kind: "type", insert: 'IndexError("${1:message}")' },
    { name: "NotImplementedError", detail: "exception", doc: "The starter code raises this. Replace it with your code.", kind: "type" },
    { name: "math", detail: "module", doc: "Mathematical functions: math.sqrt, math.exp, math.log, math.pi, …", kind: "module" },
  ],
  namespaces: {
    "math.": [
      fn("sqrt", ["x"], "Square root."),
      fn("exp", ["x"], "e raised to the power x. Raises OverflowError above about 709."),
      fn("log", ["x"], "Natural logarithm (ln). math.log(x, base) for other bases."),
      fn("sin", ["x"], "Sine (radians)."),
      fn("cos", ["x"], "Cosine (radians)."),
      fn("tanh", ["x"], "Hyperbolic tangent."),
      fn("fabs", ["x"], "Absolute value as a float."),
      fn("floor", ["x"], "Largest integer ≤ x."),
      fn("ceil", ["x"], "Smallest integer ≥ x."),
      fn("isfinite", ["x"], "False for infinities and NaN."),
      fn("isnan", ["x"], "True if x is NaN."),
      fn("prod", ["iterable"], "Product of the numbers."),
      fn("fsum", ["iterable"], "Accurate floating-point sum."),
      { name: "pi", detail: "3.14159…", doc: "π", kind: "constant" },
      { name: "e", detail: "2.71828…", doc: "Euler's number", kind: "constant" },
      { name: "inf", detail: "float", doc: "Positive infinity.", kind: "constant" },
    ],
  },
  members: [
    method("append", ["item"], "list: add an item to the end."),
    method("extend", ["items"], "list: add every item from another list."),
    method("pop", [], "list: remove and return the last item (or pop(i))."),
    method("insert", ["index", "item"], "list: insert before index."),
    method("copy", [], "list: a shallow copy."),
    method("index", ["item"], "list: position of the first matching item."),
    method("count", ["item"], "list: how many times item appears."),
    method("sort", [], "list: sort in place."),
    method("reverse", [], "list: reverse in place."),
  ],
  snippets: [
    { name: "for range", detail: "for i in range(n):", doc: "Loop over indices.", insert: "for ${1:i} in range(${2:len(v)}):\n    ${3:pass}", kind: "snippet" },
    { name: "for zip", detail: "for x, y in zip(a, b):", doc: "Loop over two lists in step.", insert: "for ${1:x}, ${2:y} in zip(${3:a}, ${4:b}):\n    ${5:pass}", kind: "snippet" },
    { name: "list comprehension", detail: "[expr for x in v]", doc: "Build a new list.", insert: "[${1:x} for ${2:x} in ${3:v}]", kind: "snippet" },
    { name: "raise ValueError", detail: "raise ValueError(...)", doc: "Reject bad input.", insert: 'raise ValueError("${1:message}")', kind: "snippet" },
  ],
};

const RUST: LanguageData = {
  keywords: ["fn", "pub", "let", "mut", "for", "in", "while", "loop", "if", "else", "match", "return", "break", "continue", "use", "struct", "impl", "as", "const", "true", "false", "Some", "None", "self", "Self", "where"],
  globals: [
    { name: "vec!", detail: "vec![a, b, c] / vec![value; n]", doc: "Create a Vec: vec![0.0; n] is n zeros.", insert: "vec![${1}]", kind: "macro" },
    { name: "assert!", detail: "assert!(condition, message)", doc: "Panic if the condition is false.", insert: 'assert!(${1:condition}, "${2:message}");', kind: "macro", params: ["condition", "message"] },
    { name: "assert_eq!", detail: "assert_eq!(left, right, message)", doc: "Panic if the two values differ. The usual way to check lengths.", insert: 'assert_eq!(${1:a.len()}, ${2:b.len()}, "${3:message}");', kind: "macro", params: ["left", "right", "message"] },
    { name: "panic!", detail: 'panic!("message")', doc: "Stop with an error. The tests count a panic as \"raised an error\".", insert: 'panic!("${1:message}")', kind: "macro" },
    { name: "println!", detail: 'println!("{:?}", value)', doc: "Print to the program output.", insert: 'println!("${1:{:?}}", ${2:value});', kind: "macro" },
    { name: "Vec", detail: "Vec<T>", doc: "A growable array. Vec::new(), Vec::with_capacity(n), vec![...].", kind: "type" },
    { name: "f64", detail: "type", doc: "64-bit float. f64::INFINITY, f64::NEG_INFINITY, f64::NAN.", kind: "type" },
    { name: "usize", detail: "type", doc: "Unsigned integer used for sizes and indices.", kind: "type" },
    { name: "u32", detail: "type", doc: "32-bit unsigned integer (used by xorshift32).", kind: "type" },
  ],
  namespaces: {
    "Vec::": [fn("new", [], "An empty Vec."), fn("with_capacity", ["n"], "An empty Vec with room for n items (avoids reallocations).")],
    "f64::": [
      { name: "INFINITY", detail: "f64", doc: "Positive infinity.", kind: "constant" },
      { name: "NEG_INFINITY", detail: "f64", doc: "Negative infinity (a good start for a running max).", kind: "constant" },
      { name: "NAN", detail: "f64", doc: "Not a number.", kind: "constant" },
      fn("max", ["a", "b"], "The larger of two floats."),
      fn("min", ["a", "b"], "The smaller of two floats."),
    ],
    "u32::": [{ name: "MAX", detail: "u32", doc: "4294967295 = 2³² − 1", kind: "constant" }],
    "std::f64::consts::": [
      { name: "PI", detail: "f64", doc: "π", kind: "constant" },
      { name: "E", detail: "f64", doc: "Euler's number", kind: "constant" },
    ],
  },
  members: [
    method("len", [], "Number of elements."),
    method("is_empty", [], "True if there are no elements."),
    method("iter", [], "Iterate over references to the elements."),
    method("iter_mut", [], "Iterate over mutable references."),
    method("push", ["value"], "Vec: append to the end."),
    method("pop", [], "Vec: remove the last element (returns Option)."),
    method("to_vec", [], "Slice: copy into a new Vec."),
    method("clone", [], "A deep copy."),
    method("swap", ["i", "j"], "Swap two elements."),
    method("extend_from_slice", ["other"], "Vec: append copies of every element of a slice."),
    method("chunks", ["size"], "Iterate over consecutive sub-slices of length size (the last may be shorter)."),
    method("map", ["|x| ..."], "Iterator: transform each item."),
    method("zip", ["other"], "Iterator: pair items with another iterator, stopping at the shorter."),
    method("enumerate", [], "Iterator: pairs (index, item)."),
    method("rev", [], "Iterator: reverse order."),
    method("sum", [], "Iterator: add up the items. Often needs a type: .sum::<f64>()."),
    method("fold", ["init", "|acc, x| ..."], "Iterator: combine all items into one value."),
    method("collect", [], "Iterator: gather into a collection, e.g. let v: Vec<f64> = ….collect();"),
    method("filter", ["|x| ..."], "Iterator: keep items matching a condition."),
    method("count", [], "Iterator: number of items."),
    method("cloned", [], "Iterator: turn &f64 items into f64."),
    method("sqrt", [], "f64: square root."),
    method("exp", [], "f64: e^x."),
    method("ln", [], "f64: natural logarithm."),
    method("abs", [], "f64: absolute value."),
    method("powi", ["n"], "f64: raise to an integer power."),
    method("powf", ["p"], "f64: raise to a float power."),
    method("sin", [], "f64: sine."),
    method("cos", [], "f64: cosine."),
    method("tanh", [], "f64: hyperbolic tangent."),
    method("max", ["other"], "f64: the larger value."),
    method("min", ["other"], "f64: the smaller value."),
    method("is_nan", [], "f64: true for NaN."),
    method("unwrap", [], "Option/Result: the value inside, or panic."),
  ],
  snippets: [
    { name: "for range", detail: "for i in 0..n { }", doc: "Loop over indices.", insert: "for ${1:i} in 0..${2:v.len()} {\n    ${3}\n}", kind: "snippet" },
    { name: "for iter", detail: "for x in v { }", doc: "Loop over elements.", insert: "for ${1:x} in ${2:v} {\n    ${3}\n}", kind: "snippet" },
    { name: "let mut vec", detail: "let mut out = Vec::with_capacity(n);", doc: "An output vector.", insert: "let mut ${1:out} = Vec::with_capacity(${2:n});", kind: "snippet" },
    { name: "zeros matrix", detail: "vec![vec![0.0; cols]; rows]", doc: "A rows × cols matrix of zeros.", insert: "vec![vec![0.0; ${1:cols}]; ${2:rows}]", kind: "snippet" },
  ],
};

const CPP: LanguageData = {
  keywords: ["for", "while", "do", "if", "else", "return", "break", "continue", "const", "auto", "double", "int", "bool", "void", "true", "false", "throw", "static_cast", "struct", "using", "namespace", "nullptr", "sizeof"],
  globals: [
    { name: "std", detail: "namespace", doc: "The standard library: std::vector, std::sqrt, std::invalid_argument, …", kind: "module" },
  ],
  namespaces: {
    "std::": [
      { name: "vector", detail: "std::vector<T>", doc: "A growable array. std::vector<double> v(n, 0.0) is n zeros.", kind: "type", insert: "vector<${1:double}>" },
      { name: "size_t", detail: "type", doc: "Unsigned integer for sizes and indices.", kind: "type" },
      { name: "uint32_t", detail: "type", doc: "32-bit unsigned integer (from <cstdint>).", kind: "type" },
      fn("sqrt", ["x"], "Square root (<cmath>)."),
      fn("exp", ["x"], "e^x (<cmath>)."),
      fn("log", ["x"], "Natural logarithm (<cmath>)."),
      fn("sin", ["x"], "Sine (<cmath>)."),
      fn("cos", ["x"], "Cosine (<cmath>)."),
      fn("tanh", ["x"], "Hyperbolic tangent (<cmath>)."),
      fn("fabs", ["x"], "Absolute value of a double (<cmath>)."),
      fn("pow", ["base", "exp"], "base^exp (<cmath>)."),
      fn("max", ["a", "b"], "The larger value (<algorithm>)."),
      fn("min", ["a", "b"], "The smaller value (<algorithm>)."),
      fn("swap", ["a", "b"], "Swap two values (<utility>)."),
      fn("isnan", ["x"], "True for NaN (<cmath>)."),
      { name: "invalid_argument", detail: "exception", doc: 'Throw for bad input: throw std::invalid_argument("lengths differ");', kind: "type", insert: 'invalid_argument("${1:message}")' },
      { name: "out_of_range", detail: "exception", doc: "Throw for an index out of range.", kind: "type", insert: 'out_of_range("${1:message}")' },
      { name: "function", detail: "std::function<R(Args...)>", doc: "Holds any callable, e.g. std::function<double(double)>.", kind: "type" },
      { name: "numeric_limits", detail: "std::numeric_limits<double>", doc: "numeric_limits<double>::infinity(), ::max(), …", kind: "type", insert: "numeric_limits<double>::${1:infinity}()" },
      fn("accumulate", ["first", "last", "init"], "Sum a range (<numeric>): std::accumulate(v.begin(), v.end(), 0.0)."),
      fn("max_element", ["first", "last"], "Iterator to the largest element (<algorithm>). Don't call it on an empty range and dereference."),
      { name: "cout", detail: "std::ostream", doc: 'Print: std::cout << x << "\\n";', kind: "constant" },
    ],
    "std::numbers::": [{ name: "pi", detail: "double", doc: "π (C++20, <numbers>)", kind: "constant" }],
  },
  members: [
    method("size", [], "Number of elements (a std::size_t)."),
    method("empty", [], "True if there are no elements."),
    method("push_back", ["value"], "Append to the end."),
    method("reserve", ["n"], "Make room for n elements without changing the size."),
    method("resize", ["n"], "Change the size (new elements are zero)."),
    method("assign", ["first", "last"], "Replace the contents with a range."),
    method("insert", ["pos", "first", "last"], "Insert elements before pos."),
    method("begin", [], "Iterator to the first element."),
    method("end", [], "Iterator past the last element."),
    method("front", [], "The first element."),
    method("back", [], "The last element."),
    method("at", ["i"], "Element i, with bounds checking (throws std::out_of_range)."),
    method("clear", [], "Remove every element."),
  ],
  snippets: [
    { name: "for index", detail: "for (std::size_t i = 0; i < n; ++i)", doc: "Loop over indices.", insert: "for (std::size_t ${1:i} = 0; ${1:i} < ${2:v.size()}; ++${1:i}) {\n    ${3}\n}", kind: "snippet" },
    { name: "for each", detail: "for (double x : v)", doc: "Loop over elements.", insert: "for (${1:double} ${2:x} : ${3:v}) {\n    ${4}\n}", kind: "snippet" },
    { name: "throw invalid_argument", detail: "throw std::invalid_argument(...)", doc: "Reject bad input.", insert: 'throw std::invalid_argument("${1:message}");', kind: "snippet" },
    { name: "zeros vector", detail: "std::vector<double> v(n, 0.0);", doc: "n zeros.", insert: "std::vector<double> ${1:out}(${2:n}, 0.0);", kind: "snippet" },
    { name: "zeros matrix", detail: "rows × cols of zeros", doc: "A matrix of zeros.", insert: "std::vector<std::vector<double>> ${1:m}(${2:rows}, std::vector<double>(${3:cols}, 0.0));", kind: "snippet" },
  ],
};

export const LANGUAGE_DATA: Record<Language, LanguageData> = { python: PYTHON, rust: RUST, cpp: CPP };
