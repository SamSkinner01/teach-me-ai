// Compact display of test values: numbers, vectors, matrices and function arguments.

export function formatNumber(x: unknown): string {
  if (typeof x === "boolean") return x ? "true" : "false";
  if (typeof x !== "number") return String(x);
  if (Number.isNaN(x)) return "NaN";
  if (!Number.isFinite(x)) return x > 0 ? "∞" : "−∞";
  if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x);
  const abs = Math.abs(x);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e7)) return x.toExponential(4);
  return String(Number(x.toPrecision(10)));
}

function isMatrix(v: unknown): v is unknown[][] {
  return Array.isArray(v) && v.length > 0 && v.every((r) => Array.isArray(r));
}

export function Value({ v }: { v: unknown }) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if (typeof o.fn === "string") return <span className="val-fn">{o.fn}</span>;
    if (typeof o.__repr__ === "string") return <code>{o.__repr__}</code>;
    return <code>{JSON.stringify(v)}</code>;
  }
  if (isMatrix(v)) {
    const cols = Math.max(...v.map((r) => r.length));
    if (v.length > 8 || cols > 8) return <code>{`${v.length}×${cols} matrix`}</code>;
    return (
      <span className="val-mat" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
        {v.map((row, i) =>
          Array.from({ length: cols }, (_, j) => (
            <span key={`${i}-${j}`} className={j < row.length ? "" : "val-missing"}>
              {j < row.length ? formatNumber(row[j]) : "·"}
            </span>
          )),
        )}
      </span>
    );
  }
  if (Array.isArray(v)) {
    if (v.length > 12) {
      return <code>[{v.slice(0, 10).map(formatNumber).join(", ")}, … {v.length} items]</code>;
    }
    return <code>[{v.map(formatNumber).join(", ")}]</code>;
  }
  if (v === null || v === undefined) return <span className="muted">nothing</span>;
  return <code>{formatNumber(v)}</code>;
}
