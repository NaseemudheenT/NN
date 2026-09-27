/**
 * Long-form text, measured for reading.
 *
 * One column, 62 characters or so, with the display face on the headings and a
 * hairline above each one. Nothing clever: a page of prose only has to be
 * comfortable to read.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="nn-wrap py-16">
      <div className="nn-prose max-w-[62ch]">{children}</div>
    </div>
  );
}
