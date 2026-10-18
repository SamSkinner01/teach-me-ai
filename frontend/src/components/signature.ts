import type { Language, Param } from "../api";

const PY: Record<string, string> = {
  float: "float",
  int: "int",
  bool: "bool",
  vec: "list[float]",
  mat: "list[list[float]]",
  ivec: "list[int]",
  fn1: "Callable[[float], float]",
  fnv: "Callable[[list[float]], float]",
};

const RS_PARAM: Record<string, string> = {
  float: "f64",
  int: "usize",
  bool: "bool",
  vec: "&[f64]",
  mat: "&[Vec<f64>]",
  ivec: "&[usize]",
  fn1: "impl Fn(f64) -> f64",
  fnv: "impl Fn(&[f64]) -> f64",
};

const RS_RET: Record<string, string> = {
  float: "f64",
  int: "usize",
  bool: "bool",
  vec: "Vec<f64>",
  mat: "Vec<Vec<f64>>",
  ivec: "Vec<usize>",
};

const CPP_PARAM: Record<string, string> = {
  float: "double",
  int: "std::size_t",
  bool: "bool",
  vec: "const std::vector<double>&",
  mat: "const std::vector<std::vector<double>>&",
  ivec: "const std::vector<std::size_t>&",
  fn1: "const std::function<double(double)>&",
  fnv: "const std::function<double(const std::vector<double>&)>&",
};

const CPP_RET: Record<string, string> = {
  float: "double",
  int: "std::size_t",
  bool: "bool",
  vec: "std::vector<double>",
  mat: "std::vector<std::vector<double>>",
  ivec: "std::vector<std::size_t>",
};

/** Each parameter as it appears in the learner's language, e.g. "a: &[f64]". */
export function paramStrings(lang: Language, params: Param[]): string[] {
  if (lang === "python") return params.map((p) => `${p.name}: ${PY[p.type]}`);
  if (lang === "rust") return params.map((p) => `${p.name}: ${RS_PARAM[p.type]}`);
  return params.map((p) => `${CPP_PARAM[p.type]} ${p.name}`);
}

/** The function signature the learner must keep, written in their language. */
export function signature(lang: Language, fn: string, params: Param[], returns: string): string {
  const args = paramStrings(lang, params).join(", ");
  if (lang === "python") return `def ${fn}(${args}) -> ${PY[returns]}`;
  if (lang === "rust") return `pub fn ${fn}(${args}) -> ${RS_RET[returns]}`;
  return `${CPP_RET[returns]} ${fn}(${args})`;
}

/** How each language signals "invalid input". */
export function errorWord(lang: Language): string {
  return lang === "python" ? "raise an exception" : lang === "rust" ? "panic" : "throw an exception";
}
