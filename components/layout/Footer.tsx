import Link from "next/link";
import { LogoMark } from "@/components/brand/LogoMark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/collection", label: "Collection 001" },
      { href: "/collections", label: "All collections" },
      { href: "/boys", label: "Boys" },
      { href: "/trial-room", label: "Trial room" },
      { href: "/stylist", label: "Ask the stylist" },
    ],
  },
  {
    title: "The house",
    links: [
      { href: "/about", label: "About Nero Noren" },
      { href: "/journal", label: "Journal" },
      { href: "/sizing", label: "Sizing and fit" },
      { href: "/care", label: "Fabric care" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/delivery", label: "Delivery and returns" },
      { href: "/settings", label: "Settings" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="nn-footer">
      <div className="nn-wrap">
        <div className="nn-footer__top">
          {/* the lockup, as the board stacks it */}
          <div className="nn-footer__brand">
            <LogoMark size={40} ring={false} shimmer={false} title={null} />
            <p className="nn-wordmark nn-footer__wordmark">Nero Noren</p>
            <p className="nn-footer__audience">Men &amp; Boys</p>
            <p className="nn-footer__line">Timeless style builds character</p>
            <p className="nn-footer__blurb">
              European-inspired menswear, cut for Indian life. Online first, delivered across
              India.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="nn-footer__column">
              <h2 className="nn-label">{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="nn-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="nn-footer__base">
          <span>
            © {new Date().getFullYear()} Nero Noren Private Limited. All rights reserved.
          </span>
          <span>Prices include GST. Free size exchanges within 7 days of delivery.</span>
        </div>
      </div>
    </footer>
  );
}
