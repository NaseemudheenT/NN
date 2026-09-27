import { ShowroomPlateStatic } from "@/components/showroom/ShowroomPlateStatic";

/**
 * The band at the top of every page below the home page.
 *
 * Carries the living showroom light behind it, quietly, so moving between pages
 * feels like moving through one building rather than between documents.
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
  children?: React.ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b">
      <ShowroomPlateStatic />
      <div className="nn-wrap relative pb-14 pt-32">
        <p className="nn-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-[22ch] text-title">{title}</h1>
        {lede ? (
          <p className="mt-5 max-w-[52ch] text-[var(--ink-soft)]">{lede}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
