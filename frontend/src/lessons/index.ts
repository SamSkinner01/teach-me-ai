import type { MDXContent } from "mdx/types";

// Each lesson is content/<lesson id>.mdx, loaded on demand.
const loaders = import.meta.glob<{ default: MDXContent }>("./*.mdx");

export function lessonLoader(id: string): (() => Promise<{ default: MDXContent }>) | undefined {
  return loaders[`./${id}.mdx`];
}
