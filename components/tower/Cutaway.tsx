"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Section } from "./Section";
import { INTERIOR, bandFor, type Hotspot, type Level } from "@/lib/tower/floors";

const CUTAWAY = "/assets/flagship/nn-tower-cutaway.webp";

/**
 * The tower, seen in section.
 *
 * ── the engine ───────────────────────────────────────────────────────
 * No WebGL. The whole building is one tall surface that PANS, driven by a
 * Framer Motion spring, and that is a deliberate architectural choice
 * rather than a shortcut: a browser cannot ray-trace travertine, and a
 * polygonal approximation of travertine looks like a video game. A
 * photographic section panned on a spring looks like a building, costs one
 * composited layer, and never drops a frame on a phone.
 *
 * ── two surfaces, one geometry ───────────────────────────────────────
 * A drawing underneath, a photograph on top when one exists, and BOTH are
 * positioned from the same bandFor(). So the hotspots, the elevator and
 * the lighting are already correct before any render arrives, and when it
 * does it drops straight in behind coordinates that have been verified
 * against the drawing.
 *
 * ── the pan ──────────────────────────────────────────────────────────
 * Stiffness 48 against damping 22 at mass 1.1 is a lift, not a lerp: it
 * accelerates, it arrives, and it settles without overshooting into a
 * bounce. A bouncing building is a cartoon, which is the one thing this
 * must not be.
 */
export function Cutaway({
  activeFloor,
  onHotspot,
  price,
}: {
  activeFloor: number;
  onHotspot: (spot: Hotspot, level: Level) => void;
  /** Resolves a catalogue handle to a formatted price. Never invented. */
  price: (handle: string) => string | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState(false);

  /* The building is 2.4 screens tall; the viewport slides over it. */
  const TALL = 2.4;

  const band = bandFor(activeFloor);
  /* Centre the active band in the viewport. The surface is TALL screens
     high, so one screen is 1/TALL of it. */
  const target = -((band.top + band.height / 2) * TALL - 0.5) * 100;

  const panY = useSpring(target, { stiffness: 48, damping: 22, mass: 1.1 });
  useEffect(() => panY.set(target), [target, panY]);

  /* Mouse parallax: the camera leans, the building does not move. ±10 px
     is the whole budget — enough to feel dimensional, too little to read
     as an effect. */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 42, damping: 20 });
  const sy = useSpring(my, { stiffness: 42, damping: 20 });
  const leanX = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const leanY = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const lean = useTransform(sx, [-0.5, 0.5], [1.012, 1.028]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => el.removeEventListener("pointermove", move);
  }, [mx, my]);

  /* The photograph, probed before it is requested. A missing file must not
     log a 404 on every visit — that noise outlives the feature. */
  useEffect(() => {
    let live = true;
    void fetch(CUTAWAY, { method: "HEAD" })
      .then((r) => { if (live && r.ok) setPhoto(true); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  return (
    <div ref={host} className="tower__stage">
      <motion.div
        className="tower__surface"
        style={{ y: useTransform(panY, (v) => `${v}%`), x: leanX, scale: lean, height: `${TALL * 100}%` }}
      >
        <motion.div className="tower__inner" style={{ y: leanY }}>
          {/* the drawing, always */}
          <Section activeFloor={activeFloor} />

          {/* the photograph, when there is one */}
          {photo ? (
            <motion.div
              className="tower__photo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={CUTAWAY} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
            </motion.div>
          ) : null}

          {/* the lit band — every floor but the active one falls back */}
          {INTERIOR.map((level) => {
            const b = bandFor(level.floor);
            const on = level.floor === activeFloor;
            return (
              <div
                key={level.id}
                className="tower__band"
                data-on={on || undefined}
                style={{ top: `${b.top * 100}%`, height: `${b.height * 100}%` }}
              />
            );
          })}

          {/* the hotspots of the active level only — a building covered in
              markers is a map, not a room */}
          {INTERIOR.filter((l) => l.floor === activeFloor).map((level) =>
            level.hotspots.map((spot, i) => {
              const b = bandFor(level.floor);
              const money = spot.handle ? price(spot.handle) : null;
              return (
                <motion.button
                  key={spot.id}
                  type="button"
                  className="spot"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 240, damping: 20 }}
                  style={{
                    left: `${spot.x}%`,
                    top: `${(b.top + (spot.y / 100) * b.height) * 100}%`,
                  }}
                  onClick={() => onHotspot(spot, level)}
                  aria-label={money ? `${spot.label}, ${money}` : spot.label}
                >
                  <span className="spot__pulse" aria-hidden />
                  <span className="spot__dot" aria-hidden />
                  <span className="spot__tip">
                    <span className="spot__name">{spot.label}</span>
                    {money ? <span className="spot__price tnum">{money}</span> : null}
                  </span>
                </motion.button>
              );
            }),
          )}
        </motion.div>
      </motion.div>

      {/* the light in the room, and the dark at its edges */}
      <div className="tower__vignette" aria-hidden />
    </div>
  );
}
