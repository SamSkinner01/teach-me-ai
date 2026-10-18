// Self-hosted Monaco (no CDN): the core API, the editor features, and the
// Python / Rust / C++ syntax highlighters. Imported only by lazy chunks.
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-esm/editor/editor.api.js";
import EditorWorker from "monaco-esm/editor/editor.worker.js?worker";
import "./monaco-features";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

monaco.editor.defineTheme("tmai-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: { "editor.background": "#ffffff", "editorLineNumber.foreground": "#a3a9ba" },
});
monaco.editor.defineTheme("tmai-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: { "editor.background": "#131620", "editorLineNumber.foreground": "#4b5366" },
});

export { monaco };
