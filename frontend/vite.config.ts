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
      // Monaco's ESM sources, for importing individual editor features. The "~"
      // matters: Vite treats any specifier starting with a letter (like
      // "monaco-esm/...") as an npm package and pre-bundles it in dev, which
      // breaks the editor worker's `?worker` import (and `optimizeDeps.exclude`
      // doesn't apply to aliases). A "~" specifier is never pre-bundled.
      "~monaco": fileURLToPath(new URL("./node_modules/monaco-editor/esm/vs", import.meta.url)),
    },
  },
  // Lessons are .mdx, which the dev server's dependency scanner can't read, so
  // packages imported only from lessons would be discovered mid-session (forcing
  // a re-bundle and reload). Pre-bundle them at startup instead.
  optimizeDeps: {
    include: ["@mdx-js/react"],
  },
  server: {
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});
