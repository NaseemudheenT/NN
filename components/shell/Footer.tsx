import Link from "next/link";
import { Lockup } from "@/components/brand/Monogram";
import { Subscribe } from "./Subscribe";

const COLUMNS = [
  {
    head: "Shop",
    links: [
      { href: "/men", label: "Men" },
      { href: "/boys", label: "Boys" },
      { href: "/collection", label: "Collection" },
      { href: "/atelier", label: "Atelier" },
      { href: "/stylist", label: "Stylist" },
    ],
  },
  {
    head: "About",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/atelier", label: "Craftsmanship" },
      { href: "/about#made", label: "How it is made" },
      { href: "/journal", label: "Journal" },
      { href: "/about#contact", label: "Contact" },
    ],
  },
  {
    head: "Support",
    links: [
      { href: "/sizing", label: "Sizing" },
      { href: "/care", label: "Care" },
      { href: "/delivery", label: "Delivery" },
      { href: "/delivery#returns", label: "Returns" },
      { href: "/about#faq", label: "FAQ" },
    ],
  },
];

const SOCIAL = [
  { href: "https://instagram.com/neronoren", label: "Instagram", d: "M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Zm4.5 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5-1.4v.01" },
  { href: "https://x.com/neronoren", label: "X", d: "m4 4 7.4 9.6L4.4 20M20 4l-7.3 8.1M20 20l-7-9" },
  { href: "https://youtube.com/@neronoren", label: "YouTube", d: "M3.4 8.2a2.6 2.6 0 0 1 2.2-2.2 56 56 0 0 1 12.8 0 2.6 2.6 0 0 1 2.2 2.2 30 30 0 0 1 0 7.6 2.6 2.6 0 0 1-2.2 2.2 56 56 0 0 1-12.8 0 2.6 2.6 0 0 1-2.2-2.2 30 30 0 0 1 0-7.6ZM10.3 9.4l4.4 2.6-4.4 2.6Z" },
];

/** The foot of the building. Same hairlines, same tracking, no new ideas. */
export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftr__in">
        <div className="ftr__brand">
          <Lockup size={48} tagline />
        </div>

        <div className="ftr__join">
          <h2 className="d-h3">Join our world</h2>
          <p className="small muted">
            Be the first to know about new collections, exclusive offers and more.
          </p>
          <Subscribe />
          <ul className="ftr__social">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="icon-btn" aria-label={s.label} rel="noreferrer noopener" target="_blank">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={s.d} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.head} className="ftr__col" aria-label={col.head}>
            <h2 className="label label--soft">{col.head}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="ul-grow">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="wrap ftr__base">
        <p className="small muted">
          © {new Date().getFullYear()} Nero Noren Private Limited. All rights reserved.
        </p>
        <p className="small ftr__legal">
          <Link href="/privacy" className="ul-grow">Privacy</Link>
          <Link href="/terms" className="ul-grow">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
