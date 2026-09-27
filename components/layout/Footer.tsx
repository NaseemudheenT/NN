import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/brand/LogoMark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/collection", label: "Collection 001" },
      { href: "/trial-room", label: "Trial room" },
      { href: "/stylist", label: "Ask the stylist" },
      { href: "/bag", label: "Your bag" },
    ],
  },
  {
    title: "The house",
    links: [
      { href: "/about", label: "About Nero Noren" },
      { href: "/sizing", label: "Sizing and fit" },
      { href: "/care", label: "Fabric care" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/delivery", label: "Delivery and returns" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t" style={{ background: "var(--surface)" }}>
      <div className="nn-wrap grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={34} shimmer={false} title={null} />
            <Wordmark className="text-[0.95rem]" />
          </div>
          <p className="mt-5 max-w-[34ch] text-fine text-[var(--ink-soft)]">
            European-inspired menswear, cut for Indian life. Online first, delivered
            across India.
          </p>
          <p className="nn-eyebrow mt-6">The art of dressing well.</p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="nn-eyebrow font-[family-name:var(--font-ui)]">{col.title}</h2>
            <ul className="mt-4 flex list-none flex-col gap-2 p-0">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="nn-link text-fine">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="nn-wrap flex flex-col gap-2 border-t py-7 text-fine text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} Nero Noren Private Limited. All rights reserved.
        </span>
        <span>Prices include GST. Free size exchanges within 7 days of delivery.</span>
      </div>
    </footer>
  );
}
