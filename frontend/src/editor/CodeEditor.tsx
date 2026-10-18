import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type { Language, LibrarySignature } from "../api";
import { useTheme } from "../state/theme";
import type { Diagnostic } from "./diagnostics";
import { clearEditorContext, registerIntellisense, setEditorContext } from "./intellisense";
import { monaco } from "./monaco-setup";

registerIntellisense();

const MONACO_LANG: Record<Language, string> = { python: "python", rust: "rust", cpp: "cpp" };

type EditorInstance = Parameters<OnMount>[0];

export interface CodeEditorProps {
  value: string;
  language: Language;
  onChange?: (value: string) => void;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  height?: number;
  label?: string;
  /** Earlier library functions, for completions, hover and signature help. */
  library?: LibrarySignature[];
  /** Errors from the last run, shown as squiggles until the next edit. */
  diagnostics?: Diagnostic[];
}

export default function CodeEditor({
  value,
  language,
  onChange,
  onRun,
  onSubmit,
  readOnly,
  height,
  label,
  library,
  diagnostics,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const runRef = useRef(onRun);
  const submitRef = useRef(onSubmit);
  const editorRef = useRef<EditorInstance | null>(null);
  useEffect(() => {
    runRef.current = onRun;
    submitRef.current = onSubmit;
  });

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submitRef.current?.());
    const model = editor.getModel();
    if (model) setEditorContext(model, { language, library: library ?? [] });
    // Squiggles describe the code as it was when it ran; drop them once it changes.
    editor.onDidChangeModelContent(() => {
      const m = editor.getModel();
      if (m && monaco.editor.getModelMarkers({ resource: m.uri, owner: "tmai" }).length) {
        monaco.editor.setModelMarkers(m, "tmai", []);
      }
    });
  };

  // Keep the completion context current (and release it when unmounting).
  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (model) setEditorContext(model, { language, library: library ?? [] });
  }, [language, library]);
  useEffect(
    () => () => {
      const model = editorRef.current?.getModel();
      if (model) clearEditorContext(model);
    },
    [],
  );

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    const lines = model.getLineCount();
    monaco.editor.setModelMarkers(
      model,
      "tmai",
      (diagnostics ?? [])
        .filter((d) => d.line >= 1 && d.line <= lines)
        .map((d) => ({
          startLineNumber: d.line,
          startColumn: Math.max(1, d.column),
          endLineNumber: d.line,
          endColumn: model.getLineMaxColumn(d.line),
          message: d.message,
          severity: d.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
          source: language === "python" ? "python" : language === "rust" ? "rustc" : "g++",
        })),
    );
  }, [diagnostics, language]);

  const lines = value.split("\n").length;
  const h = height ?? Math.min(560, Math.max(240, lines * 20 + 40));

  return (
    <div className="code-editor" style={{ height: h }} aria-label={label ?? "Code editor"}>
      <Editor
        value={value}
        language={MONACO_LANG[language]}
        theme={theme === "dark" ? "tmai-dark" : "tmai-light"}
        onChange={(v) => onChange?.(v ?? "")}
        onMount={onMount}
        loading={
          <div className="editor-loading">
            <span className="spinner" />
          </div>
        }
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          renderLineHighlight: readOnly ? "none" : "line",
          padding: { top: 10, bottom: 10 },
          scrollbar: { alwaysConsumeMouseWheel: false },
          wordWrap: "off",
          fixedOverflowWidgets: true,
          stickyScroll: { enabled: false },
          lineNumbersMinChars: 3,
          // IntelliSense
          quickSuggestions: readOnly ? false : { other: true, comments: false, strings: false },
          suggestOnTriggerCharacters: !readOnly,
          wordBasedSuggestions: "currentDocument",
          acceptSuggestionOnEnter: "smart",
          snippetSuggestions: "inline",
          parameterHints: { enabled: true },
          hover: { enabled: "on", delay: 400 },
          suggest: { showWords: true, preview: true },
        }}
      />
    </div>
  );
}

/** Syntax-highlight a snippet to HTML (for the read-only library view). */
export async function colorize(code: string, language: Language): Promise<string> {
  return monaco.editor.colorize(code, MONACO_LANG[language], { tabSize: 4 });
}
