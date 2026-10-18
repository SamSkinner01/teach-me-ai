import katex from "katex";
import { Fragment, useMemo } from "react";

/** Inline KaTeX. */
export function Tex({ children, display = false }: { children: string; display?: boolean }) {
  const html = useMemo(
    // Readouts format negatives with U+2212; KaTeX wants ASCII '-' (it renders it as a minus).
    () =>
      katex.renderToString(children.replace(/\u2212/g, "-"), {
        throwOnError: false,
        displayMode: display,
        output: "html",
        // \htmlClass{tex-a}{…} colours a term with a theme colour (see .tex-a in CSS).
        trust: (ctx) => ctx.command === "\\htmlClass",
        strict: "ignore",
      }),
    [children, display],
  );
  return <span className={display ? "tex-display" : "tex"} dangerouslySetInnerHTML={{ __html: html }} />;
}

const TOKEN = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*)/g;

/**
 * Renders a short string with $inline math$, `code` and **bold**.
 * Used for quiz questions, hints and other text passed as props.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter((p) => p !== "");
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) return <Tex key={i}>{part.slice(1, -1)}</Tex>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
