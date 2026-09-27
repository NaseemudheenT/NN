/**
 * Long-form text, measured for reading.
 *
 * One column at about 62 characters, which is where a line stops being
 * comfortable. Nothing clever: a page of prose only has to be easy to read.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="nn-wrap" style={{ paddingBottom: "var(--space-hall)" }}>
      <div className="nn-prose nn-wrap--text">{children}</div>
    </div>
  );
}
