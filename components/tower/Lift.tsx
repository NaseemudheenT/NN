"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BY_HEIGHT, type Level } from "@/lib/tower/floors";
import { Bag, Ruler, Search, Sound, Sparkle } from "@/components/ui/icons";
import { useBag } from "@/lib/bag/BagProvider";
import { useStylist } from "@/components/stylist/StylistProvider";
import { useSearch } from "@/components/shell/SearchProvider";
import { useSoundscape } from "@/components/shell/SoundscapeProvider";

/**
 * The lift.
 *
 * A real building's lift car has a column of numbered buttons and a light
 * behind the one you are on, and that is exactly what this is. It is the
 * only navigation NN Tower needs, which is why it is the only navigation
 * NN Tower has.
 *
 * ── why the numbers are always visible ───────────────────────────────
 * An earlier version showed nine dots that grew names on hover. It looked
 * beautiful and it was unusable, because a dot has no name on a touch
 * screen and hover does not exist there. The numbers stay; the names
 * expand beside them on pointer devices, where expanding costs nothing.
 */
export function Lift({
  active,
  onLevel,
}: {
  active: Level;
  onLevel: (l: Level) => void;
}) {
  const { count, openBag } = useBag();
  const { open: openStylist } = useStylist();
  const { open: openSearch } = useSearch();
  const { playing: sound, toggle: toggleSound } = useSoundscape();
  const reduce = useReducedMotion();
  const list = useRef<HTMLDivElement>(null);

  /* Up and down arrows move between floors, the way the car does. */
  const onKey = (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = BY_HEIGHT.findIndex((l) => l.id === active.id);
    const next = BY_HEIGHT[Math.min(BY_HEIGHT.length - 1, Math.max(0, i + dir))];
    onLevel(next);
    const el = list.current?.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`);
    el?.focus();
  };

  return (
    <motion.aside
      className="lift glass glass--refract"
      aria-label="Floors"
      initial={reduce ? false : { opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="lift__plaque label">NN Tower</p>

      <div className="lift__car" ref={list} onKeyDown={onKey} role="group" aria-label="Levels">
        {BY_HEIGHT.map((l) => {
          const on = l.id === active.id;
          return (
            <button
              key={l.id}
              type="button"
              data-id={l.id}
              className="lift__btn"
              data-on={on || undefined}
              aria-current={on ? "true" : undefined}
              onClick={() => onLevel(l)}
            >
              <span className="lift__no" aria-hidden="true">
                {l.floor === 0 ? "G" : l.floor}
              </span>
              <span className="lift__name">{l.title}</span>
            </button>
          );
        })}
      </div>

      {/* Drawn icons, not typed symbols.
          These were ✦ ◫ ⌕ ◻ ◌ — characters almost no UI font actually
          carries, so they fell back to whatever the system had and the bag
          came out as a filled white box. The project already ships real
          SVGs; they render identically on every machine. */}
      <div className="lift__tools">
        <button type="button" className="lift__tool" onClick={openStylist}>
          <span className="lift__no"><Sparkle /></span>
          <span className="lift__name">Stylist</span>
        </button>
        <a className="lift__tool" href="/trial-room">
          <span className="lift__no"><Ruler /></span>
          <span className="lift__name">Trial room</span>
        </a>
        <button type="button" className="lift__tool" onClick={openSearch}>
          <span className="lift__no"><Search /></span>
          <span className="lift__name">Search</span>
        </button>
        <button type="button" className="lift__tool" onClick={openBag}>
          <span className="lift__no" data-count={count > 0 || undefined}>
            {count > 0 ? count : <Bag />}
          </span>
          <span className="lift__name">Bag{count > 0 ? ` (${count})` : ""}</span>
        </button>
        <button type="button" className="lift__tool" onClick={toggleSound} aria-pressed={sound}>
          <span className="lift__no" data-on={sound || undefined}><Sound /></span>
          <span className="lift__name">Sound {sound ? "on" : "off"}</span>
        </button>
      </div>
    </motion.aside>
  );
}
