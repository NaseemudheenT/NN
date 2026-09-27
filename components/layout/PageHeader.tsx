import type { ReactNode } from "react";

/**
 * The head of every page below the home page.
 *
 * One component, so the label, the title and the lede sit in the same place on
 * every route and moving between them feels like moving through one building
 * rather than between documents. The atmosphere behind it is the layout's and
 * persists across navigation, so this adds nothing of its own.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <header className="nn-pagehead">
      <div className="nn-wrap">
        <p className="nn-label nn-label--metal">{eyebrow}</p>
        <h1 className="nn-pagehead__title">{title}</h1>
        {lede ? <p className="nn-pagehead__lede">{lede}</p> : null}
        {children}
      </div>
    </header>
  );
}
