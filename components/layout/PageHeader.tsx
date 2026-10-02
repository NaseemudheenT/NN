/** The top of an information page. Eyebrow, title, one paragraph. */
export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="phead">
      <div className="wrap">
        {eyebrow ? <p className="label label--soft reveal">{eyebrow}</p> : null}
        <h1 className="d-h1 reveal" style={{ "--reveal-delay": "70ms" } as React.CSSProperties}>{title}</h1>
        {lede ? (
          <p className="lead phead__lede reveal" style={{ "--reveal-delay": "140ms" } as React.CSSProperties}>{lede}</p>
        ) : null}
      </div>
    </header>
  );
}
