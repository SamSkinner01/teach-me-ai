import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { GLOSSARY } from "../glossary";

export function GlossaryPage() {
  const [query, setQuery] = useState("");
  const location = useLocation();
  const terms = Object.keys(GLOSSARY)
    .sort((a, b) => a.localeCompare(b))
    .filter((t) => !query || t.includes(query.toLowerCase()) || GLOSSARY[t].toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: "center" });
  }, [location.hash]);

  return (
    <div className="page glossary-page">
      <header className="page-head">
        <h1>Glossary</h1>
        <p className="muted">Every term used in the lessons. In a lesson, hover an underlined term to see its definition.</p>
        <input
          className="input glossary-search"
          placeholder="Search terms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the glossary"
        />
      </header>
      <dl className="glossary">
        {terms.map((t) => (
          <div key={t} id={t} className={`glossary-entry ${location.hash === `#${encodeURIComponent(t)}` ? "target" : ""}`}>
            <dt>{t}</dt>
            <dd>{GLOSSARY[t]}</dd>
          </div>
        ))}
        {terms.length === 0 && <p className="muted">No terms match “{query}”.</p>}
      </dl>
    </div>
  );
}
