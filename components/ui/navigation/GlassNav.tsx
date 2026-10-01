"use client";

/**
 * The navigation.
 *
 * The board's structure — Men, Boys, Collections, Journal, About — with the
 * wordmark and the MEN & BOYS lockup at the left, exactly as the header in the
 * brand board shows it.
 *
 * It behaves like a physical thing rather than a fixed bar:
 *
 *   at the top of a page it is transparent, sitting in the room
 *   once scrolled it becomes glass, so text stays readable over imagery
 *   scrolling down hides it, because the customer is reading, not navigating
 *   scrolling up brings it straight back, because they are now looking for it
 *
 * NN's own tools — the stylist, the trial room, the bag — are not in here.
 * They live in the dock, where they are reachable from anywhere without
 * competing with the collection for the customer's attention.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DURATION, EASE, SPRING } from "@/lib/motion";
import { LogoMark } from "@/components/brand/LogoMark";
import { GlassIconButton } from "@/components/ui/glass/GlassButton";
import { useBag } from "@/components/shop/BagProvider";
import { Soundscape } from "@/components/audio/Soundscape";

const LINKS = [
  { href: "/collection", label: "Men" },
  { href: "/boys", label: "Boys" },
  { href: "/collections", label: "Collections" },
  // The room you walk rather than scroll. The homepage carries you along one
  // fixed route; this is the same showroom with the camera handed over.
  { href: "/showroom", label: "Showroom" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
];

export function GlassNav() {
  const pathname = usePathname();
  const { count, openBag } = useBag();
  const { scrollY } = useScroll();

  const [lifted, setLifted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sheet, setSheet] = useState(false);
  const previous = useRef(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    setLifted(y > 24);

    // Hide going down, reveal going up — but never while the menu is open,
    // and never within the first screen, where the nav is part of the hero.
    const delta = y - previous.current;
    previous.current = y;
    if (sheet || y < 120) {
      setHidden(false);
      return;
    }
    if (Math.abs(delta) < 6) return;
    setHidden(delta > 0);
  });

  /* a route change closes the sheet */
  useEffect(() => setSheet(false), [pathname]);

  /* and locks the page behind it while it is open */
  useEffect(() => {
    document.documentElement.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.documentElement.style.removeProperty("overflow");
    };
  }, [sheet]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* The position is a CSS class, deliberately, not a JavaScript spring.
          A spring is driven by requestAnimationFrame, and rAF does not fire in
          a hidden tab or under heavy load — measured. A stalled spring leaves
          the navigation parked at an arbitrary offset, which for this
          component means the customer cannot navigate at all. A CSS transform
          either runs or does not: its resting state is always one of the two
          states I declared, and the default one is visible. */}
      <header className={`nn-nav${lifted ? " nn-nav--lifted" : ""}${hidden ? " nn-nav--hidden" : ""}`}>
        <div className="nn-nav__inner nn-wrap">
          {/* ── the mark ── */}
          <Link href="/" className="nn-nav__brand" aria-label="Nero Noren, home">
            <LogoMark size={26} ring={false} sheen="once" title={null} />
            <span className="nn-nav__lockup">
              <span className="nn-wordmark nn-nav__wordmark">Nero Noren</span>
              <span className="nn-nav__audience">Men &amp; Boys</span>
            </span>
          </Link>

          {/* ── the board's structure ── */}
          <nav className="nn-nav__links" aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nn-nav__link"
                data-active={isActive(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── actions ── */}
          <div className="nn-nav__actions">
            {/* The room's own sound. Deliberately the quietest thing in the
                header: eight hairlines, and the only control the soundscape
                has anywhere on the site. */}
            <Soundscape />

            <GlassIconButton
              label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
              tone="quiet"
              size="sm"
              onClick={openBag}
            >
              <span className="relative grid place-items-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <path d="M5.5 8h13l-1.1 11.6H6.6z" />
                  <path d="M9 8V6.4a3 3 0 0 1 6 0V8" strokeLinecap="round" />
                </svg>
                {count > 0 ? <span className="nn-nav__count">{count}</span> : null}
              </span>
            </GlassIconButton>

            <button
              type="button"
              className="nn-nav__menu"
              aria-expanded={sheet}
              aria-controls="nn-nav-sheet"
              onClick={() => setSheet((open) => !open)}
            >
              <span className="sr-only">{sheet ? "Close menu" : "Open menu"}</span>
              <span className="nn-nav__bars" data-open={sheet} aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── the mobile sheet ── */}
      <AnimatePresence>
        {sheet ? (
          <motion.div
            key="sheet"
            id="nn-nav-sheet"
            className="nn-nav__sheet glass glass--block"
            initial={{ y: "-100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={SPRING.heavy}
          >
            <nav className="nn-nav__sheetlinks" aria-label="Main, mobile">
              {LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ y: 14, opacity: 0.001 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: DURATION.panel, ease: EASE.out, delay: 0.06 + i * 0.045 }}
                >
                  <Link href={link.href} className="nn-nav__sheetlink" data-active={isActive(link.href)}>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="nn-nav__sheetfoot">
              <Link href="/trial-room" className="nn-link">Trial room</Link>
              <Link href="/stylist" className="nn-link">Stylist</Link>
              <Link href="/settings" className="nn-link">Settings</Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
