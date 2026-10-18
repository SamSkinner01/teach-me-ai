// Small inline icons (stroke-based, inherit currentColor).

const PATHS: Record<string, string> = {
  check: "M4 12.5l5 5L20 6.5",
  x: "M6 6l12 12M18 6L6 18",
  lock: "M7 11V8a5 5 0 0110 0v3M5.5 11h13v9h-13z",
  play: "M7 5l12 7-12 7z",
  send: "M4 12l16-8-6 16-3-7-7-1z",
  reset: "M4 4v6h6M4.5 15a8 8 0 102-8.5L4 10",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7",
  clock: "M12 7v5l3 2M12 21a9 9 0 110-18 9 9 0 010 18z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 100-10 5 5 0 000 10z",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  monitor: "M3 5h18v11H3zM8 20h8M12 16v4",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronDown: "M6 9l6 6 6-6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
  circle: "M12 21a9 9 0 110-18 9 9 0 010 18z",
  dot: "M12 14a2 2 0 100-4 2 2 0 000 4z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  history: "M3 12a9 9 0 103-6.7L3 8M3 3v5h5M12 7v5l3 2",
  terminal: "M4 5h16v14H4zM8 10l3 2-3 2M13 15h3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  copy: "M8 8h11v11H8zM5 16V5h11",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  pencil: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  stop: "M7 7h10v10H7z",
  chart: "M4 4v16h16M8 15l4-5 3 3 5-7",
};

export function Icon({ name, size = 16, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name] ?? PATHS.dot} />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      <g fill="none" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinecap="round">
        <path d="M8 22 L16 10 L24 22" />
        <circle cx="8" cy="22" r="2.4" fill="var(--on-accent)" />
        <circle cx="16" cy="10" r="2.4" fill="var(--on-accent)" />
        <circle cx="24" cy="22" r="2.4" fill="var(--on-accent)" />
      </g>
    </svg>
  );
}
