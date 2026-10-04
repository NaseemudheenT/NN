"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Monogram } from "@/components/brand/Monogram";
import { Bag, Ruler, Search, Sound, Sparkle } from "@/components/ui/icons";
import { LEVELS, type LevelSpec } from "@/lib/tower/spec";
import { levelById } from "@/lib/tower/floors";
import { useBag } from "@/lib/bag/BagProvider";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useSearch } from "@/components/shell/SearchProvider";
import { useSoundscape } from "@/components/shell/SoundscapeProvider";
import type { Mode } from "./three/Scene";
import type { Product } from "@/lib/catalog/types";

/**
 * NN TOWER.
 *
 * The whole website: one building, one page, everything inside it.
 *
 * ── the sequence ─────────────────────────────────────────────────────
 * Before you go in there is nothing to operate. The tower turns on its own
 * — front, flank, back, roof — and the only control on the screen is the
 * way in, in the middle. Pressing it opens the doors, walks the camera
 * through them, and only THEN does the building hand you its controls: the
 * lift panel arrives from the right as you arrive in the hall.
 *
 * That order is the point. A floor selector on screen before the customer
 * has entered the building is a menu bar on a website. A floor selector
 * that appears when the doors close behind you is a lift.
 */

const Scene = dynamic(() => import("./three/Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <div className="nn3-boot" />,
});

type Quality = "high" | "medium" | "low";

function detectQuality(): Quality {
  if (typeof navigator === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const small = window.matchMedia("(max-width: 820px)").matches;
  if (small || cores <= 4 || mem <= 4) return "low";
  if (cores >= 8 && mem >= 8) return "high";
  return "medium";
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function NNTower({ products }: { products: Product[] }) {
  const [mode, setMode] = useState<Mode>("intro");
  const [floor, setFloor] = useState<number | null>(null);
  const [explode, setExplode] = useState(0);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [ready, setReady] = useState(false);

  const { count, openBag } = useBag();
  const { open: openStylist } = useStylist();
  const { open: openSearch } = useSearch();
  const { playing: sound, toggle: toggleSound } = useSoundscape();

  useEffect(() => {
    setQuality(detectQuality());
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  /* The way in. Doors first, then the walk, then the controls. */
  const enter = useCallback(() => {
    setDoorsOpen(true);
    setMode("entering");
    const a = setTimeout(() => {
      setMode("inside");
      setFloor(0);
    }, 3200);
    const b = setTimeout(() => setDoorsOpen(false), 6000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const leave = useCallback(() => {
    setMode("intro");
    setFloor(null);
    setExplode(0);
    setDoorsOpen(false);
  }, []);

  const goFloor = useCallback((index: number) => {
    setMode("inside");
    setFloor(index);
  }, []);

  const onSelect = useCallback((s: LevelSpec) => goFloor(s.index), [goFloor]);

  const spec = useMemo(
    () => (floor === null ? null : LEVELS.find((l) => l.index === floor) ?? null),
    [floor],
  );
  const info = spec ? levelById(spec.id) : null;
  const inside = mode === "inside";

  return (
    <MotionConfig reducedMotion="user">
      <div className="nn3" data-ready={ready || undefined} data-mode={mode}>
        <Scene
          mode={mode}
          floor={floor}
          explode={explode}
          doorsOpen={doorsOpen}
          onSelect={onSelect}
          quality={quality}
        />

        {/* ── before you go in: the building, and the way in ────────── */}
        <AnimatePresence>
          {mode === "intro" && (
            <motion.div
              className="nn3-gate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.7 } }}
              transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
            >
              <Monogram size={96} className="nn3-gate__mark" title="Nero Noren" />
              <p className="nn3-gate__word">NERO NOREN</p>
              <h1 className="nn3-gate__title">NN Tower</h1>
              <p className="nn3-gate__tag label">Timeless style builds character</p>
              <button type="button" className="btn btn--glass btn--lg nn3-gate__start" onClick={enter}>
                Start
              </button>
              <p className="nn3-gate__hint small">Nine levels · Men &amp; boys</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── the lift, which only exists once you are inside ───────── */}
        <AnimatePresence>
          {inside && (
            <motion.aside
              className="nn3-lift glass glass--refract"
              aria-label="Floors"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
            >
              <p className="nn3-lift__plaque label">NN Tower</p>
              <div className="nn3-lift__car">
                {[...LEVELS].reverse().map((l, i) => {
                  const meta = levelById(l.id);
                  const on = floor === l.index;
                  return (
                    <motion.button
                      key={l.id}
                      type="button"
                      className="nn3-lift__btn"
                      data-on={on || undefined}
                      aria-current={on ? "true" : undefined}
                      onClick={() => goFloor(l.index)}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: 0.6 + i * 0.045, ease: EASE }}
                    >
                      <span className="nn3-lift__no">{l.index === 0 ? "G" : l.index}</span>
                      <span className="nn3-lift__name">{meta.title}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="nn3-lift__tools">
                <button type="button" className="nn3-lift__btn" onClick={openStylist}>
                  <span className="nn3-lift__no"><Sparkle /></span>
                  <span className="nn3-lift__name">Stylist</span>
                </button>
                <a className="nn3-lift__btn" href="/trial-room">
                  <span className="nn3-lift__no"><Ruler /></span>
                  <span className="nn3-lift__name">Trial room</span>
                </a>
                <button type="button" className="nn3-lift__btn" onClick={openSearch}>
                  <span className="nn3-lift__no"><Search /></span>
                  <span className="nn3-lift__name">Search</span>
                </button>
                <button type="button" className="nn3-lift__btn" onClick={openBag}>
                  <span className="nn3-lift__no" data-count={count > 0 || undefined}>
                    {count > 0 ? count : <Bag />}
                  </span>
                  <span className="nn3-lift__name">Bag{count > 0 ? ` (${count})` : ""}</span>
                </button>
                <button type="button" className="nn3-lift__btn" onClick={toggleSound} aria-pressed={sound}>
                  <span className="nn3-lift__no" data-on={sound || undefined}><Sound /></span>
                  <span className="nn3-lift__name">Sound {sound ? "on" : "off"}</span>
                </button>
                <button
                  type="button"
                  className="nn3-lift__btn"
                  data-on={explode > 0.5 || undefined}
                  onClick={() => setExplode((e) => (e > 0.5 ? 0 : 1))}
                >
                  <span className="nn3-lift__no">◫</span>
                  <span className="nn3-lift__name">{explode > 0.5 ? "Close model" : "Open model"}</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── what you are standing on ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {inside && info && spec && (
            <motion.section
              key={spec.id}
              className="nn3-card glass glass--refract"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <p className="label label--soft">{info.code}</p>
              <h2 className="nn3-card__title">{info.title}</h2>
              <p className="nn3-card__sub small">{info.subtitle}</p>
              <dl className="nn3-ledger">
                <div><dt>Walls</dt><dd>{spec.walls}</dd></div>
                <div><dt>Floor</dt><dd>{spec.floor}</dd></div>
                <div><dt>Light</dt><dd>{spec.kelvin} K</dd></div>
              </dl>
            </motion.section>
          )}
        </AnimatePresence>

        {inside && (
          <motion.button
            type="button"
            className="nn3-out label"
            onClick={leave}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            ← Back to the street
          </motion.button>
        )}

        {/* Every level has a real URL underneath, for links and for crawlers. */}
        <nav className="nn3-routes" aria-label="All levels">
          {LEVELS.map((l) => {
            const meta = levelById(l.id);
            return <a key={l.id} href={meta.route}>{meta.title}</a>;
          })}
          <span>{products.length} pieces</span>
        </nav>
      </div>
    </MotionConfig>
  );
}
