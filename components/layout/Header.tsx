"use client";

/**
 * The header: monogram, the five places a customer can go, the bag count and
 * the light switch. Sticky, translucent over the showroom, and it collapses to
 * a sheet on narrow screens.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark, Wordmark } from "@/components/brand/LogoMark";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { useBag } from "@/components/shop/BagProvider";

const LINKS = [
  { href: "/", label: "Showroom" },
  { href: "/collection", label: "Collection" },
  { href: "/trial-room", label: "Trial room" },
  { href: "/stylist", label: "Stylist" },
];

export function Header() {
  const pathname = usePathname();
  const { count, openBag } = useBag();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change closes the sheet.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-40 border-b transition-[background-color,border-color] duration-700"
      style={{
        background: lifted
          ? "color-mix(in srgb, var(--bg) 86%, transparent)"
          : "color-mix(in srgb, var(--bg) 40%, transparent)",
        backdropFilter: "blur(18px) saturate(1.1)",
        WebkitBackdropFilter: "blur(18px) saturate(1.1)",
        borderColor: lifted ? "var(--line)" : "transparent",
      }}
    >
      <div className="nn-wrap flex h-[68px] items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-[var(--ink)] no-underline"
          aria-label="Nero Noren, home"
        >
          <LogoMark size={30} title={null} />
          <Wordmark className="hidden text-[0.95rem] sm:inline nn-shimmer" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex list-none items-center gap-8 p-0">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="nn-link text-[var(--text-eyebrow)] uppercase tracking-[0.14em]"
                  data-active={isActive(l.href)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitch className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={openBag}
            className="nn-link text-[var(--text-eyebrow)] uppercase tracking-[0.14em] px-2"
            aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
          >
            Bag
            <span className="nn-tabular ml-1.5 text-[var(--accent)]">({count})</span>
          </button>
          <button
            type="button"
            className="md:hidden nn-link px-2 text-[var(--text-eyebrow)] uppercase tracking-[0.14em]"
            aria-expanded={open}
            aria-controls="nn-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* mobile sheet */}
      <div
        id="nn-mobile-nav"
        hidden={!open}
        className="md:hidden border-t"
        style={{ background: "var(--bg)" }}
      >
        <nav aria-label="Main, mobile" className="nn-wrap py-4">
          <ul className="flex list-none flex-col gap-1 p-0">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="nn-link block py-3 text-[0.95rem] uppercase tracking-[0.14em]"
                  data-active={isActive(l.href)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <ThemeSwitch />
          </div>
        </nav>
      </div>
    </header>
  );
}
