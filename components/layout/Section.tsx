import type { ReactNode } from "react";

/**
 * A section of the building.
 *
 * One component so every section on every page shares its rhythm: the label,
 * the rule, the title, the lede, then the content. Sections that each invented
 * their own spacing is how a site stops feeling like one place.
 */
export function Section({
  id,
  label,
  title,
  lede,
  action,
  children,
  wide = false,
}: {
  id?: string;
  label: string;
  title: string;
  lede?: string;
  /** A control at the right of the heading. */
  action?: ReactNode;
  children: ReactNode;
  /** Break out of the text measure for grids and galleries. */
  wide?: boolean;
}) {
  return (
    <section id={id} className="nn-section">
      <div className="nn-wrap">
        <header className="nn-section__head">
          <div className="nn-section__heading">
            <p className="nn-label nn-label--metal">{label}</p>
            <h2 className="nn-section__title">{title}</h2>
            {lede ? <p className="nn-section__lede">{lede}</p> : null}
          </div>
          {action ? <div className="nn-section__action">{action}</div> : null}
        </header>

        <div className={wide ? "nn-section__body nn-section__body--wide" : "nn-section__body"}>
          {children}
        </div>
      </div>
    </section>
  );
}
