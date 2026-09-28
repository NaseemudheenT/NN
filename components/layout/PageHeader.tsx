import { Reveal, RevealLines } from "@/components/motion/Reveal";

/** Every room in the building is announced the same way. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string[];
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative z-10 px-5 pb-12 pt-32 sm:px-8 md:pb-16 md:pt-44">
      <div className="mx-auto max-w-[84rem]">
        <p className="nn-meta text-ink-faint">{eyebrow}</p>
        <h1 className="nn-display mt-5 text-[clamp(2.4rem,7vw,5rem)] text-ink">
          <RevealLines lines={title} />
        </h1>
        {lede && (
          <Reveal delay={0.25}>
            <p className="nn-body mt-6 text-base text-ink-soft">{lede}</p>
          </Reveal>
        )}
        {children && <Reveal delay={0.3}>{children}</Reveal>}
      </div>
    </header>
  );
}

/** Long-form house copy: sizing, care, delivery, privacy, terms. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[46rem] space-y-8 px-5 pb-28 sm:px-8 md:pb-40 [&_h2]:font-display [&_h2]:text-[1.85rem] [&_h2]:font-light [&_h2]:leading-snug [&_h2]:text-ink [&_h3]:nn-label [&_h3]:text-ink [&_li]:nn-body [&_li]:text-[0.95rem] [&_li]:text-ink-soft [&_p]:nn-body [&_p]:text-[0.95rem] [&_p]:text-ink-soft [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_ul]:[list-style:square]">
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative z-10 px-5 sm:px-8 ${className}`}>
      <div className="mx-auto max-w-[84rem]">{children}</div>
    </section>
  );
}
