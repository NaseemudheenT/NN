"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { BY_HEIGHT, type Level } from "@/lib/tower/floors";
import { Plate } from "./Plate";

/**
 * The elevation — NN Tower, cut open, with every level named.
 *
 * This is the whole navigation. The section render carries the building;
 * nine labels hang off it on leader lines, the way an architect annotates a
 * drawing; and the floor you are on is the floor that is lit.
 *
 * ── why the building dims instead of zooming ─────────────────────────
 * The obvious move when a floor is chosen is to push the camera into it.
 * It is also the wrong one: the plate is a finite number of pixels, and
 * magnifying past about 1.3x turns limestone into porridge — the exact
 * cartoon look this build exists to kill. So the camera barely moves and
 * the LIGHT does the work instead. Everything but the chosen floor falls
 * into shadow. That reads as a building at night with one floor working
 * late, it costs two composited gradients, and it never loses a pixel.
 *
 * ── the leader lines are horizontal on purpose ───────────────────────
 * Each label sits at exactly its anchor's height, so the line between
 * them is a straight horizontal rule. That is the drawing convention the
 * founder's own boards use, it reads instantly, and it means the labels
 * sort themselves vertically into the order of the floors without any
 * collision logic.
 */
export function Elevation({
  active,
  onLevel,
}: {
  active: Level;
  onLevel: (l: Level) => void;
}) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Level | null>(null);
  const shown = hover ?? active;

  /* Mouse lean. Small — the building is heavy and heavy things barely move. */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 24, mass: 1.1 });
  const sy = useSpring(my, { stiffness: 40, damping: 24, mass: 1.1 });
  const leanX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const leanY = useTransform(sy, [-0.5, 0.5], [9, -9]);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  /* The light follows the chosen floor, and it takes its time getting there. */
  const lx = useSpring(active.anchor.x, { stiffness: 52, damping: 22, mass: 1.1 });
  const ly = useSpring(active.anchor.y, { stiffness: 52, damping: 22, mass: 1.1 });
  useEffect(() => {
    lx.set(active.anchor.x);
    ly.set(active.anchor.y);
  }, [active, lx, ly]);
  const cx = useTransform(lx, (v) => `${v}%`);
  const cy = useTransform(ly, (v) => `${v}%`);

  return (
    <div className="elev">
      <motion.div
        className="elev__frame"
        ref={frame}
        style={reduce ? undefined : { x: leanX, y: leanY }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Plate
          id="cutaway"
          alt="NN Tower cut open: the rooftop dome and terrace, the owner's level, the bag and checkout floor, the AI stylist's lit fitting pods, the journal and archive, men and boys, the atelier, the collection gallery, and the lit entrance on the street."
          priority
          sizes="(max-width: 900px) 92vw, 70vh"
          className="elev__plate"
        />

        {/* night: everything away from the chosen floor falls back into shadow */}
        <motion.div
          className="elev__shade"
          style={{ ["--cx" as string]: cx, ["--cy" as string]: cy }}
          aria-hidden="true"
        />
        {/* and the chosen floor takes the warm light the windows already have */}
        <motion.div
          className="elev__glow"
          style={{ ["--cx" as string]: cx, ["--cy" as string]: cy }}
          aria-hidden="true"
        />

        {/* leader lines, drawn in the same percentage space as the anchors */}
        {/* One rule, to the thing being named.
            All nine at once left eight lines running out into black with
            nothing on the end of them, which reads as damage to the
            drawing rather than as annotation. */}
        <svg className="elev__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line
            x1={shown.anchor.side === "left" ? 0 : 100}
            y1={shown.anchor.y}
            x2={shown.anchor.x}
            y2={shown.anchor.y}
            className="elev__line"
            data-on
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* the point on the building each label names */}
        {BY_HEIGHT.map((l) => (
          <button
            key={l.id}
            type="button"
            className="elev__pt"
            data-on={l.id === shown.id || undefined}
            style={{ left: `${l.anchor.x}%`, top: `${l.anchor.y}%` }}
            onClick={() => onLevel(l)}
            onPointerEnter={() => setHover(l)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(l)}
            onBlur={() => setHover(null)}
            aria-label={`${l.code} — ${l.title}`}
          >
            <span className="elev__dot" aria-hidden="true" />
          </button>
        ))}

        {/* the annotation, one at a time
            Nine labels at once is a parts diagram, not a building, and two of
            the nine sit two percent apart and would collide. So the drawing
            annotates only what the pointer is on. The floor you are STANDING
            on is already named, in type, on the card to the left — printing
            it twice just crowds the drawing — and the lift on the right is
            where the full list lives. */}
        <AnimatePresence mode="wait">
          {hover && (
          <motion.div
            key={hover.id}
            className="elev__tag"
            data-side={hover.anchor.side}
            style={{ top: `${hover.anchor.y}%` }}
            initial={{ opacity: 0, x: hover.anchor.side === "left" ? 14 : -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          >
            <span className="elev__code label">{hover.code}</span>
            <span className="elev__title">{hover.title}</span>
            <span className="elev__sub small">{hover.subtitle}</span>
          </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
