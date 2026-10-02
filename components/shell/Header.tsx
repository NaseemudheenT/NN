"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Monogram, Wordmark } from "@/components/brand/Monogram";
import { Bag, Search, User } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { useSearch } from "@/components/shell/SearchProvider";

export const NAV = [
  { href: "/men", label: "Men" },
  { href: "/boys", label: "Boys" },
  { href: "/collection", label: "Collection" },
  { href: "/atelier", label: "Atelier" },
  { href: "/stylist", label: "Stylist" },
] as const;

/**
 * The top bar.
 *
 * Over the showroom it is dark glass and carries nothing but the mark, the
 * nav and three controls — the hall is the page, and a heavy bar across the
 * top of it would be a shutter. On the shop's own ivory pages it resolves
 * into a light bar with a hairline under it.
 *
 * It hides on the way down and returns on the way up, because the one time a
 * customer wants the bag within reach is the moment they have decided to go
 * back for something.
 */
export function Header({ overRoom = false }: { overRoom?: boolean }) {
  const pathname = usePathname();
  const { count, openBag } = useBag();
  const { open: openSearch } = useSearch();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 280 && y > last.current + 4);
      last.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = overRoom && !scrolled;

  return (
    <header
      className="hdr"
      data-dark={dark || undefined}
      data-scrolled={scrolled || undefined}
      data-hidden={hidden || undefined}
    >
      <div className="hdr__in">
        <Link href="/" className="hdr__brand" aria-label="Nero Noren — home">
          <Monogram size={26} />
          <Wordmark size="0.78rem" className="hdr__word" />
        </Link>

        <nav className="hdr__nav" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hdr__link ul-grow label"
              data-on={pathname.startsWith(item.href) || undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hdr__tools">
          <button type="button" className="hdr__search" onClick={openSearch}>
            <span className="hdr__search-text">Search products, styles, fabrics…</span>
            <Search size={16} />
          </button>

          <Link href="/account" className="icon-btn" aria-label="Account">
            <User size={19} />
          </Link>

          <button type="button" className="icon-btn hdr__bag" onClick={openBag} aria-label={`Bag, ${count} items`}>
            <Bag size={19} />
            {count > 0 ? <span className="hdr__count tnum">{count}</span> : null}
          </button>
        </div>
      </div>
    </header>
  );
}
