"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Monogram } from "@/components/brand/Monogram";
import { GlassIconButton } from "@/components/ui/glass/Glass";
import { useShowroom } from "./ShowroomProvider";
import { useBag, bagCount } from "@/lib/bag";
import { MOTION, PHASES } from "@/lib/tokens";

const LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/trial-room", label: "Trial room" },
  { href: "/stylist", label: "Stylist" },
  { href: "/about", label: "House" },
];

function BagGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4">
      <path d="M5.2 8h13.6l1 12.5H4.2L5.2 8Z" strokeLinejoin="round" />
      <path d="M8.8 8V6.4a3.2 3.2 0 0 1 6.4 0V8" strokeLinecap="round" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4">
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.4 15.4 4 4" strokeLinecap="round" />
    </svg>
  );
}

function PhaseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Navigation({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const { phase, override, setOverride, spatial, setSpatial, quality } = useShowroom();
  const lines = useBag((s) => s.lines);
  const setBagOpen = useBag((s) => s.setOpen);
  const count = bagCount(lines);
  const [compact, setCompact] = useState(false);
  const { scrollY } = useScroll();

  // The light control belongs to the room you are in: a change of route
  // closes it, derived rather than chased with an effect.
  const [phaseOpenOn, setPhaseOpenOn] = useState<string | null>(null);
  const phaseOpen = phaseOpenOn === pathname;
  const setPhaseOpen = (next: boolean) => setPhaseOpenOn(next ? pathname : null);

  useMotionValueEvent(scrollY, "change", (y) => setCompact(y > 64));

  const isHome = pathname === "/";

  return (
    <>
      {/* ---------------- desktop / tablet ---------------- */}
      <motion.header
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] hidden px-5 pt-5 md:block"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: MOTION.slow, ease: MOTION.ease, delay: 0.2 }}
      >
        <nav
          className={`nn-glass nn-glass-live pointer-events-auto mx-auto flex max-w-[84rem] items-center justify-between rounded-full transition-[padding,background-color] duration-500 [transition-timing-function:var(--ease-out)] ${
            compact ? "px-5 py-2" : "px-7 py-3.5"
          }`}
        >
          <Link href="/" className="group flex items-center gap-3.5" aria-label="Nero Noren — home">
            <Monogram
              className={`w-auto text-ink transition-[height,color] duration-500 group-hover:text-accent ${
                compact ? "h-5" : "h-6"
              }`}
            />
            <span className="flex flex-col leading-none">
              <span className="nn-wordmark text-[0.78rem] text-ink">Nero Noren</span>
              <AnimatePresence initial={false}>
                {!compact && (
                  <motion.span
                    className="nn-meta mt-1 text-[0.5rem] text-ink-faint"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: MOTION.base }}
                  >
                    Men &amp; Boys
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </Link>

          <ul className="flex items-center gap-9">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`nn-label relative py-1 transition-colors duration-300 ${
                      active ? "text-ink" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-[width] duration-500 [transition-timing-function:var(--ease-out)] ${
                        active ? "w-full" : "w-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <GlassIconButton label="Showroom light" onClick={() => setPhaseOpen(!phaseOpen)}>
                <PhaseGlyph />
              </GlassIconButton>
              <AnimatePresence>
                {phaseOpen && (
                  <motion.div
                    className="nn-glass absolute right-0 top-12 w-60 rounded-md p-3"
                    initial={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                    transition={{ duration: MOTION.base, ease: MOTION.ease }}
                  >
                    <p className="nn-meta mb-2.5 text-ink-faint">Showroom hour</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOverride(null)}
                        className={`nn-label rounded-sm border px-2 py-2 transition-colors ${
                          override === null
                            ? "border-accent text-accent"
                            : "border-line text-ink-soft hover:text-ink"
                        }`}
                      >
                        Your clock
                      </button>
                      {PHASES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setOverride(p)}
                          className={`nn-label rounded-sm border px-2 py-2 capitalize transition-colors ${
                            override === p
                              ? "border-accent text-accent"
                              : "border-line text-ink-soft hover:text-ink"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <hr className="nn-rule my-3" />
                    <button
                      type="button"
                      onClick={() => setSpatial(!spatial)}
                      className="nn-label flex w-full items-center justify-between text-ink-soft transition-colors hover:text-ink"
                    >
                      <span>{spatial ? "Shop flat" : "Enter the room"}</span>
                      <span className="text-accent">{spatial ? "2D" : "3D"}</span>
                    </button>
                    <p className="nn-meta mt-2 text-[0.5rem] leading-relaxed text-ink-faint">
                      Currently {phase}
                      {quality === "off" ? " · no 3D on this device" : ` · ${quality} detail`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <GlassIconButton label="Search the collection" onClick={onOpenSearch}>
              <SearchGlyph />
            </GlassIconButton>

            <GlassIconButton label={`Bag, ${count} item${count === 1 ? "" : "s"}`} onClick={() => setBagOpen(true)}>
              <BagGlyph />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.5625rem] font-semibold text-accent-ink"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={MOTION.springSnap}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </GlassIconButton>
          </div>
        </nav>
      </motion.header>

      {/* ---------------- mobile: top mark, bottom dock ---------------- */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-4 pt-4 md:hidden">
        <Link
          href="/"
          className="nn-glass pointer-events-auto flex items-center gap-2.5 rounded-full px-3.5 py-2"
          aria-label="Nero Noren — home"
        >
          <Monogram className="h-4 w-auto text-ink" />
          <span className="nn-wordmark text-[0.6rem] text-ink">Nero Noren</span>
        </Link>
        <div className="pointer-events-auto flex gap-2">
          <GlassIconButton label="Showroom light" onClick={() => setPhaseOpen(!phaseOpen)}>
            <PhaseGlyph />
          </GlassIconButton>
          <GlassIconButton label="Search" onClick={onOpenSearch}>
            <SearchGlyph />
          </GlassIconButton>
        </div>
      </header>

      <AnimatePresence>
        {phaseOpen && (
          <motion.div
            className="nn-glass fixed inset-x-4 top-20 z-[61] rounded-md p-4 md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: MOTION.base, ease: MOTION.ease }}
          >
            <p className="nn-meta mb-2.5 text-ink-faint">Showroom hour · now {phase}</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setOverride(null)}
                className={`nn-label rounded-sm border px-2 py-2.5 ${
                  override === null ? "border-accent text-accent" : "border-line text-ink-soft"
                }`}
              >
                Clock
              </button>
              {PHASES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOverride(p)}
                  className={`nn-label rounded-sm border px-2 py-2.5 capitalize ${
                    override === p ? "border-accent text-accent" : "border-line text-ink-soft"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSpatial(!spatial)}
                className="nn-label rounded-sm border border-line px-2 py-2.5 text-ink-soft"
              >
                {spatial ? "Flat" : "Room"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 md:hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: MOTION.slow, ease: MOTION.ease, delay: 0.25 }}
        aria-label="Primary"
      >
        <div className="nn-glass flex items-stretch justify-between rounded-full px-1.5 py-1.5">
          {[
            { href: "/", label: "Showroom", match: (p: string) => p === "/" },
            { href: "/collection", label: "Collection", match: (p: string) => p.startsWith("/collection") || p.startsWith("/product") },
            { href: "/trial-room", label: "Fitting", match: (p: string) => p.startsWith("/trial-room") },
            { href: "/stylist", label: "Stylist", match: (p: string) => p.startsWith("/stylist") },
          ].map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nn-label relative flex flex-1 items-center justify-center rounded-full px-1 py-3 text-[0.5625rem] transition-colors duration-300 ${
                  active ? "text-accent-ink" : "text-ink-faint"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nn-dock"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={MOTION.spring}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setBagOpen(true)}
            className="nn-label relative flex flex-1 items-center justify-center rounded-full px-1 py-3 text-[0.5625rem] text-ink-faint"
          >
            <span className="relative">
              Bag
              {count > 0 && (
                <span className="absolute -right-3 -top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-1 text-[0.5rem] font-semibold text-accent-ink">
                  {count}
                </span>
              )}
            </span>
          </button>
        </div>
        {isHome && null}
      </motion.nav>
    </>
  );
}
