// Small components available inside every lesson (see components/mdx.tsx).

import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LANGUAGE_NAMES, type Language } from "../api";
import { lookupTerm } from "../glossary";
import { useSession } from "../state/session";
import { Icon } from "./Icon";

/** Show children only on the given language track(s). */
export function Lang({ only, not, children }: { only?: Language | Language[]; not?: Language; children: ReactNode }) {
  const { language } = useSession();
  const lang = language ?? "python";
  const allowed = only === undefined ? true : Array.isArray(only) ? only.includes(lang) : only === lang;
  if (!allowed || not === lang) return null;
  return <>{children}</>;
}

/** The learner's language name, e.g. "Rust". */
export function LangName() {
  const { language } = useSession();
  return <>{LANGUAGE_NAMES[language ?? "python"]}</>;
}

/** Pick text per language inline: <PerLang python="list" rust="Vec" cpp="std::vector" /> */
export function PerLang(props: Partial<Record<Language, ReactNode>>) {
  const { language } = useSession();
  return <>{props[language ?? "python"] ?? props.python}</>;
}

/** A glossary term with a hover/focus definition. */
export function Term({ t, children }: { t?: string; children: ReactNode }) {
  const key = t ?? (typeof children === "string" ? children : "");
  const definition = lookupTerm(key);
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!definition) return <>{children}</>;
  return (
    <span
      className="term"
      tabIndex={0}
      aria-describedby={id}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span role="tooltip" id={id} className={`term-tip ${open ? "open" : ""}`}>
        <strong>{key}</strong>
        <span>{definition}</span>
        <Link to={`/glossary#${encodeURIComponent(key)}`} tabIndex={-1}>
          Glossary →
        </Link>
      </span>
    </span>
  );
}

const CALLOUT_ICON: Record<string, string> = { note: "book", tip: "bulb", warning: "sparkle", lang: "code", why: "sparkle" };

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: "note" | "tip" | "warning" | "lang" | "why";
  title?: string;
  children: ReactNode;
}) {
  const { language } = useSession();
  const heading = title ?? (type === "lang" ? `${LANGUAGE_NAMES[language ?? "python"]} notes` : undefined);
  return (
    <aside className={`callout callout-${type}`}>
      {heading && (
        <div className="callout-title">
          <Icon name={CALLOUT_ICON[type] ?? "book"} size={15} />
          {heading}
        </div>
      )}
      <div className="callout-body">{children}</div>
    </aside>
  );
}

/** Two-column "key idea" summary box. */
export function KeyIdea({ children }: { children: ReactNode }) {
  return (
    <div className="key-idea">
      <div className="key-idea-label">Key idea</div>
      <div>{children}</div>
    </div>
  );
}

/** A wide container that lets figures break out of the prose column. */
export function Wide({ children }: { children: ReactNode }) {
  return <div className="wide">{children}</div>;
}
