import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type { Language } from "../api";
import { useTheme } from "../state/theme";
import { monaco } from "./monaco-setup";

const MONACO_LANG: Record<Language, string> = { python: "python", rust: "rust", cpp: "cpp" };

export interface CodeEditorProps {
  value: string;
  language: Language;
  onChange?: (value: string) => void;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  height?: number;
  label?: string;
}

export default function CodeEditor({ value, language, onChange, onRun, onSubmit, readOnly, height, label }: CodeEditorProps) {
  const { theme } = useTheme();
  const runRef = useRef(onRun);
  const submitRef = useRef(onSubmit);
  useEffect(() => {
    runRef.current = onRun;
    submitRef.current = onSubmit;
  });

  const onMount: OnMount = (editor) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => submitRef.current?.());
  };

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
        loading={<div className="editor-loading"><span className="spinner" /></div>}
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
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  );
}

/** Syntax-highlight a snippet to HTML (for the read-only library view). */
export async function colorize(code: string, language: Language): Promise<string> {
  return monaco.editor.colorize(code, MONACO_LANG[language], { tabSize: 4 });
}
