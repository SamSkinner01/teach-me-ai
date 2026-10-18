import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex, [rehypeHighlight, { detect: false }]],
        providerImportSource: "@mdx-js/react",
      }),
    },
    react({ include: /\.(mdx|tsx|ts)$/ }),
  ],
  resolve: {
    alias: {
      // Monaco's ESM sources, for importing individual editor features.
      "monaco-esm": fileURLToPath(new URL("./node_modules/monaco-editor/esm/vs", import.meta.url)),
    },
  },
  // Monaco is imported file-by-file through the alias above. Letting the dev
  // server pre-bundle it means it gets discovered (and re-bundled) mid-session
  // the first time an exercise loads, which breaks its `?worker` import and
  // blanked the app. Serve it as plain ES modules instead, as the build does.
  optimizeDeps: {
    exclude: ["monaco-esm", "monaco-editor"],
  },
  server: {
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});
