import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, LANGUAGE_NAMES, type Language, type LibraryFunction } from "../api";
import { Icon } from "../components/Icon";
import { useSession } from "../state/session";
import { useTheme } from "../state/theme";

function Highlighted({ code, language }: { code: string; language: Language }) {
  const [html, setHtml] = useState<string | null>(null);
  const { theme } = useTheme();
  useEffect(() => {
    let cancelled = false;
    import("../editor/CodeEditor")
      .then(async (m) => {
        // colorize() uses the current Monaco theme's token colours.
        const { monaco } = await import("../editor/monaco-setup");
        monaco.editor.setTheme(theme === "dark" ? "tmai-dark" : "tmai-light");
        return m.colorize(code, language);
      })
      .then((h) => !cancelled && setHtml(h))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);
  return html ? (
    <pre className="library-code" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <pre className="library-code">
      <code>{code}</code>
    </pre>
  );
}

export default function LibraryPage() {
  const { language } = useSession();
  const [fns, setFns] = useState<LibraryFunction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.library().then(
      (r) => setFns(r.functions),
      (e) => setError(String(e)),
    );
  }, [language]);

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!fns || !language) {
    return (
      <div className="center-screen">
        <span className="spinner" />
      </div>
    );
  }
  const written = fns.filter((f) => f.code);

  return (
    <div className="page library-page">
      <header className="page-head">
        <span className="eyebrow">{LANGUAGE_NAMES[language]} track</span>
        <h1>My library</h1>
        <p className="lead muted">
          Every function you've passed becomes part of your library, and later exercises call it. By the capstone,
          this is the code your CNN runs on. {written.length} of {fns.length} written so far.
        </p>
      </header>
      <ol className="library-list">
        {fns.map((f) => (
          <li key={f.exercise_id} className={`card library-item ${f.code ? "" : "missing"}`}>
            <div className="library-item-head">
              <code className="library-fn">{f.function}</code>
              <span className="muted small">{f.title}</span>
              <Link to={`/learn/${f.lesson_id}#exercise-${f.exercise_id}`} className="small library-link">
                {f.code ? "Edit" : "Write it"} <Icon name="chevronRight" size={12} />
              </Link>
            </div>
            {f.code ? (
              <Highlighted code={f.code} language={language} />
            ) : (
              <p className="small muted library-empty">Not written yet.</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
