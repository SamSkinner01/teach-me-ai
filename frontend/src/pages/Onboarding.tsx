import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, type Language } from "../api";
import { Icon } from "../components/Icon";
import { useSession } from "../state/session";

export const LANGUAGE_INFO: Record<Language, { name: string; tagline: string; pros: string[]; cons: string[]; sample: string }> = {
  python: {
    name: "Python",
    tagline: "The language of machine learning research.",
    pros: ["Easiest to read and write", "No compile step: run and see results instantly", "What most ML code is written in"],
    cons: ["Pure-Python loops are slow: training your CNN takes minutes, so the course trains on a slice of MNIST"],
    sample: "def dot(a, b):\n    total = 0.0\n    for i in range(len(a)):\n        total += a[i] * b[i]\n    return total",
  },
  rust: {
    name: "Rust",
    tagline: "Fast, and the compiler catches your mistakes.",
    pros: ["As fast as C++", "Memory-safe: no segfaults, and index errors are caught", "A great way to learn Rust with a concrete goal"],
    cons: ["Stricter compiler: ownership and borrowing take some getting used to"],
    sample: "pub fn dot(a: &[f64], b: &[f64]) -> f64 {\n    let mut total = 0.0;\n    for i in 0..a.len() {\n        total += a[i] * b[i];\n    }\n    total\n}",
  },
  cpp: {
    name: "C++",
    tagline: "Close to the metal, like real ML frameworks.",
    pros: ["Very fast: the core of PyTorch and TensorFlow is C++", "You see exactly how memory is laid out"],
    cons: ["Manual memory management", "Mistakes can crash the program (segfaults) instead of giving an error"],
    sample:
      "double dot(const std::vector<double>& a,\n           const std::vector<double>& b) {\n    double total = 0.0;\n    for (size_t i = 0; i < a.size(); ++i)\n        total += a[i] * b[i];\n    return total;\n}",
  },
};

export const LOGO: Record<Language, string> = { python: "Py", rust: "Rs", cpp: "C++" };

export function Onboarding() {
  const { me, setMe } = useSession();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<Language | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const existing = new Set(me?.tracks.map((t) => t.language));

  async function start() {
    if (!choice) return;
    setBusy(true);
    setError(null);
    try {
      setMe(await api.startTrack(choice));
      navigate("/learn", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="page onboarding">
      <div className="onboarding-head">
        <span className="eyebrow">Step 1 of 1</span>
        <h1>Choose your language</h1>
        <p className="lead muted">
          You'll write every exercise, from your first vector function to the final CNN, in this language. The math is
          the same whichever you pick.
        </p>
      </div>

      <div className="lang-cards" role="radiogroup" aria-label="Programming language">
        {(Object.keys(LANGUAGE_INFO) as Language[]).map((lang) => {
          const info = LANGUAGE_INFO[lang];
          const selected = choice === lang;
          return (
            <button
              key={lang}
              role="radio"
              aria-checked={selected}
              className={`lang-card card ${selected ? "selected" : ""}`}
              onClick={() => setChoice(lang)}
            >
              <div className="lang-card-head">
                <span className={`lang-logo lang-${lang}`}>{LOGO[lang]}</span>
                <div>
                  <h2>{info.name}</h2>
                  <p className="small muted">{info.tagline}</p>
                </div>
                {existing.has(lang) && <span className="badge">started</span>}
              </div>
              <pre className="lang-sample">
                <code>{info.sample}</code>
              </pre>
              <ul className="lang-pros">
                {info.pros.map((p) => (
                  <li key={p}>
                    <Icon name="check" size={14} /> {p}
                  </li>
                ))}
                {info.cons.map((c) => (
                  <li key={c} className="con">
                    <Icon name="dot" size={14} /> {c}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="onboarding-foot card card-pad">
        <div>
          <strong>This choice is for the whole course.</strong>
          <p className="small muted">
            You can't switch languages partway through. To learn another one later, start a separate track from the
            beginning; your progress in this one is kept.
          </p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={!choice || busy} onClick={start}>
          {busy && <span className="spinner" />}
          {choice ? `Start the ${LANGUAGE_INFO[choice].name} track` : "Pick a language"}
          <Icon name="arrowRight" />
        </button>
      </div>
    </div>
  );
}
