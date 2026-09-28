import Link from "next/link";
import { Monogram } from "@/components/brand/Monogram";
import { TAGLINE, SECONDARY_TAGLINE } from "@/lib/tokens";

const COLUMNS = [
  {
    title: "The house",
    links: [
      { href: "/about", label: "About" },
      { href: "/collection", label: "Collection 001" },
      { href: "/stylist", label: "Stylist" },
    ],
  },
  {
    title: "Wearing",
    links: [
      { href: "/trial-room", label: "Trial room" },
      { href: "/sizing", label: "Sizing" },
      { href: "/care", label: "Care" },
    ],
  },
  {
    title: "Ordering",
    links: [
      { href: "/delivery", label: "Delivery & returns" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-bg-deep/70 px-5 pb-28 pt-16 backdrop-blur-sm md:pb-16 md:pt-24">
      <div className="mx-auto grid max-w-[84rem] gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Monogram className="h-8 w-auto text-ink" />
          <p className="nn-wordmark mt-5 text-[0.7rem] text-ink">Nero Noren</p>
          <p className="nn-meta mt-2 text-ink-faint">Men &amp; Boys</p>
          <p className="nn-body mt-6 max-w-xs text-sm text-ink-soft">{TAGLINE}.</p>
          <p className="nn-meta mt-2 text-ink-faint">{SECONDARY_TAGLINE}</p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="nn-meta mb-5 text-ink-faint">{col.title}</h2>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="nn-label text-ink-soft transition-colors duration-300 hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-[84rem] flex-col gap-3 border-t border-line-soft pt-7 md:flex-row md:items-center md:justify-between">
        <p className="nn-meta text-ink-faint">
          © {new Date().getFullYear()} Nero Noren. All rights reserved.
        </p>
        <p className="nn-meta text-ink-faint">Made for what comes next</p>
      </div>
    </footer>
  );
}
