// Completions, hover docs and signature help for the exercise editor.
// Everything runs in the browser: the learner's library signatures come from
// the API, and per-language knowledge from languageData.ts.

import type { Language, LibrarySignature } from "../api";
import { paramStrings, signature } from "../components/signature";
import { LANGUAGE_DATA, type Entry } from "./languageData";
import { monaco } from "./monaco-setup";

type Monaco = typeof monaco;
type Model = ReturnType<Monaco["editor"]["createModel"]>;
type Position = InstanceType<Monaco["Position"]>;

export interface EditorContext {
  language: Language;
  library: LibrarySignature[];
}

const contexts = new Map<string, EditorContext>();

/** Tell the providers which library functions a given editor model can call. */
export function setEditorContext(model: Model, ctx: EditorContext) {
  contexts.set(model.uri.toString(), ctx);
}

export function clearEditorContext(model: Model) {
  contexts.delete(model.uri.toString());
}

const MONACO_TO_LANG: Record<string, Language> = { python: "python", rust: "rust", cpp: "cpp" };

function contextFor(model: Model, monacoLang: string): EditorContext {
  return contexts.get(model.uri.toString()) ?? { language: MONACO_TO_LANG[monacoLang], library: [] };
}

function kindOf(m: Monaco, kind: Entry["kind"]) {
  const K = m.languages.CompletionItemKind;
  switch (kind) {
    case "method":
      return K.Method;
    case "keyword":
      return K.Keyword;
    case "type":
      return K.Class;
    case "constant":
      return K.Constant;
    case "module":
      return K.Module;
    case "snippet":
      return K.Snippet;
    case "macro":
      return K.Function;
    default:
      return K.Function;
  }
}

function libraryDoc(lang: Language, f: LibrarySignature): string {
  return [
    "```" + (lang === "cpp" ? "cpp" : lang),
    signature(lang, f.function, f.params, f.returns),
    "```",
    `**${f.title}**: from your library.`,
  ].join("\n");
}

function libraryInsert(lang: Language, f: LibrarySignature): string {
  const args = f.params.map((p, i) => {
    // Rust takes slices by reference; nudge the learner towards `&name`.
    const ref = lang === "rust" && ["vec", "mat", "ivec"].includes(p.type) ? "&" : "";
    return `${ref}\${${i + 1}:${p.name}}`;
  });
  return `${f.function}(${args.join(", ")})`;
}

/** The text of the current line up to the cursor. */
function lineBefore(model: Model, position: Position): string {
  return model.getLineContent(position.lineNumber).slice(0, position.column - 1);
}

let registered = false;

export function registerIntellisense() {
  if (registered) return;
  registered = true;
  const m = monaco;
  const Rule = m.languages.CompletionItemInsertTextRule.InsertAsSnippet;

  for (const monacoLang of ["python", "rust", "cpp"]) {
    m.languages.registerCompletionItemProvider(monacoLang, {
      triggerCharacters: [".", ":"],
      provideCompletionItems(model, position) {
        const ctx = contextFor(model, monacoLang);
        const data = LANGUAGE_DATA[ctx.language];
        const word = model.getWordUntilPosition(position);
        const range = new m.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        const before = lineBefore(model, position).slice(0, word.startColumn - 1);

        const fromEntries = (entries: Entry[], sort: string) =>
          entries.map((e) => ({
            label: e.name,
            kind: kindOf(m, e.kind),
            detail: e.detail,
            documentation: { value: e.doc },
            insertText: e.insert ?? e.name,
            insertTextRules: (e.insert ?? "").includes("$") ? Rule : undefined,
            sortText: `${sort}${e.name}`,
            range,
          }));

        // After a namespace like "math." or "std::", offer only its members.
        const ns = Object.keys(data.namespaces)
          .sort((a, b) => b.length - a.length)
          .find((k) => before.endsWith(k));
        if (ns) return { suggestions: fromEntries(data.namespaces[ns], "0") };

        // After "." on some value, offer common members (types aren't known).
        if (before.endsWith(".")) {
          if (/\d\.$/.test(before)) return { suggestions: [] }; // "1." is a number, not member access
          return { suggestions: fromEntries(data.members, "0") };
        }
        if (before.endsWith(":")) return { suggestions: [] };

        const library = ctx.library.map((f) => ({
          label: f.function,
          kind: m.languages.CompletionItemKind.Function,
          detail: `${signature(ctx.language, f.function, f.params, f.returns)}  · your library`,
          documentation: { value: libraryDoc(ctx.language, f) },
          insertText: libraryInsert(ctx.language, f),
          insertTextRules: Rule,
          sortText: `0${f.function}`,
          range,
          // Show the parameter list right away, as if "(" had been typed.
          command: { id: "editor.action.triggerParameterHints", title: "Show parameters" },
        }));
        const keywords = data.keywords.map((k) => ({
          label: k,
          kind: m.languages.CompletionItemKind.Keyword,
          insertText: k,
          sortText: `3${k}`,
          range,
        }));
        return {
          suggestions: [...library, ...fromEntries(data.globals, "1"), ...fromEntries(data.snippets, "2"), ...keywords],
        };
      },
    });

    m.languages.registerHoverProvider(monacoLang, {
      provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        const ctx = contextFor(model, monacoLang);
        const range = new m.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        const lib = ctx.library.find((f) => f.function === word.word);
        if (lib) return { range, contents: [{ value: libraryDoc(ctx.language, lib) }] };
        const data = LANGUAGE_DATA[ctx.language];
        const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1);
        const pool = before.endsWith(".") || before.endsWith("::")
          ? [...data.members, ...Object.values(data.namespaces).flat()]
          : [...data.globals, ...Object.values(data.namespaces).flat()];
        const entry = pool.find((e) => e.name.replace(/!$/, "") === word.word);
        if (!entry) return null;
        return { range, contents: [{ value: `\`${entry.detail}\`` }, { value: entry.doc }] };
      },
    });

    m.languages.registerSignatureHelpProvider(monacoLang, {
      signatureHelpTriggerCharacters: ["(", ","],
      signatureHelpRetriggerCharacters: [","],
      provideSignatureHelp(model, position) {
        const ctx = contextFor(model, monacoLang);
        const text = lineBefore(model, position);
        // Find the innermost unclosed "(" and count top-level commas after it.
        let depth = 0;
        let commas = 0;
        let open = -1;
        for (let i = text.length - 1; i >= 0; i--) {
          const c = text[i];
          if (c === ")" || c === "]" || c === "}") depth++;
          else if (c === "(" || c === "[" || c === "{") {
            if (depth === 0) {
              if (c === "(") open = i;
              break;
            }
            depth--;
          } else if (c === "," && depth === 0) commas++;
        }
        if (open < 0) return null;
        const name = text.slice(0, open).match(/([A-Za-z_][A-Za-z0-9_]*)!?\s*$/)?.[1];
        if (!name) return null;

        const lib = ctx.library.find((f) => f.function === name);
        const dispose = () => {};
        if (lib) {
          const params = paramStrings(ctx.language, lib.params);
          return {
            dispose,
            value: {
              activeSignature: 0,
              activeParameter: Math.min(commas, params.length - 1),
              signatures: [
                {
                  label: signature(ctx.language, lib.function, lib.params, lib.returns),
                  documentation: { value: `**${lib.title}**: from your library.` },
                  parameters: params.map((p) => ({ label: p })),
                },
              ],
            },
          };
        }
        const data = LANGUAGE_DATA[ctx.language];
        const entry = [...data.globals, ...data.members, ...Object.values(data.namespaces).flat()].find(
          (e) => e.name.replace(/!$/, "") === name && e.params,
        );
        if (!entry?.params) return null;
        return {
          dispose,
          value: {
            activeSignature: 0,
            activeParameter: Math.min(commas, Math.max(0, entry.params.length - 1)),
            signatures: [
              {
                label: `${entry.name}(${entry.params.join(", ")})`,
                documentation: { value: entry.doc },
                parameters: entry.params.map((p) => ({ label: p })),
              },
            ],
          },
        };
      },
    });
  }
}
