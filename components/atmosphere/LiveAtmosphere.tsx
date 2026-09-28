"use client";

/**
 * The room the whole site sits inside.
 *
 * This lives in the layout, not in a page, so it survives navigation. Moving
 * between routes should feel like walking between areas of one building, and
 * that is only true if the light does not restart at every door.
 *
 * Six layers, back to front:
 *
 *   1. GROUND      the deep falloff of the room. Static.
 *   2. WINDOW      the architectural glazing. Shifts with the sun's real
 *                  position, so its angle at nine in the morning is not its
 *                  angle at five in the afternoon.
 *   3. VOLUME      the light in the air between the glass and the floor.
 *                  This is what makes a space read as having air in it.
 *   4. POOLS       what the recessed ceiling lights put on the surfaces.
 *                  Three of them, each on its own parallax factor.
 *   5. MOTES       dust, but only in the beam and only in daylight. Four
 *                  specks, not a particle system.
 *   6. GRAIN       film grain over everything, which is what stops a set of
 *                  smooth gradients looking like a set of smooth gradients.
 *
 * Everything moves on transform and opacity only, so the compositor does the
 * work and the main thread stays free. The pointer and the scroll feed motion
 * values rather than React state: a background that re-rendered the tree sixty
 * times a second would cost more than it is worth.
 */

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/motion/useReducedMotion";
import { useDayPhase } from "@/components/theme/ThemeProvider";

/** Film grain, rasterised once by the browser from an inline filter. */
/* Every CSS value below is a single-line constant, deliberately.
   A multi-line template literal in a style object serialises differently on
   the server and in the browser — React sees the shorthand on one side and
   empty longhands on the other, and discards the server HTML for the whole
   tree. That was error #418 on every page of this site. */
const GROUND =
  "radial-gradient(125% 88% at 50% 6%, var(--surface-raised) 0%, transparent 58%)," +
  "radial-gradient(150% 110% at 50% 108%, var(--surface-base) 0%, transparent 62%)," +
  "linear-gradient(180deg, var(--surface-base) 0%, var(--surface-void) 100%)";

const GLAZING =
  "repeating-linear-gradient(90deg, transparent 0 9.5%," +
  "color-mix(in srgb, var(--light-cool) 7%, transparent) 9.5% 20%," +
  "transparent 20% 21%)";

const GLAZING_MASK = "radial-gradient(120% 96% at 50% -6%, #000 34%, transparent 82%)";

const VIGNETTE =
  "radial-gradient(128% 104% at 50% 42%, transparent 44%," +
  "color-mix(in srgb, var(--surface-void) 82%, transparent) 100%)";

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E")`;

export function LiveAtmosphere() {
  const reduced = usePrefersReducedMotion();
  const { sky, phase } = useDayPhase();
  const host = useRef<HTMLDivElement>(null);

  /* ── the pointer, as a pair of springs ───────────────────────── */
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.4);
  // Heavily damped: the room should drift after the cursor, never chase it.
  const px = useSpring(pointerX, { stiffness: 42, damping: 26, mass: 1.1 });
  const py = useSpring(pointerY, { stiffness: 42, damping: 26, mass: 1.1 });

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        pointerX.set(event.clientX / window.innerWidth);
        pointerY.set(event.clientY / window.innerHeight);
        frame = 0;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, pointerX, pointerY]);

  /* ── the scroll, which moves the room rather than the page ───── */
  const { scrollYProgress } = useScroll();
  const scroll = useSpring(scrollYProgress, { stiffness: 60, damping: 30 });

  /* ── the sun, from lib/daytime ────────────────────────────────── */
  const sun = useMemo(() => {
    // Azimuth mapped across the glazed wall, elevation kept real. The angle
    // of the light through the windows is therefore genuinely the angle of
    // the sun where the customer is standing.
    const t = Math.min(1, Math.max(0, (sky.solar.azimuth - 90) / 180));
    const tilt = Math.max(-28, Math.min(28, 24 - sky.solar.elevation * 0.42));
    return {
      /** Where the beam enters, as a percentage across the wall. Rounded:
          an unrounded float serialises to different precision on the server
          and the client, and React treats that as a hydration mismatch. */
      x: Math.round((14 + t * 68) * 100) / 100,
      /** The angle the light falls at, as whole degrees. */
      tiltDeg: Math.round(180 + tilt),
      beamDeg: Math.round(190 + tilt),
      /** How much light is in the air, and in the beam, as whole percents. */
      airPercent: Math.round(4 + sky.beam * 9),
      beamPercent: Math.round(sky.beam * 11),
      /** How strong the daylight is at all. */
      strength: sky.beam,
      /** How far the lamps have come up. */
      lamps: sky.lampLevel,
    };
  }, [sky]);

  /* ── parallax: each layer at its own depth ─────────────────────
     Written out rather than looped. useTransform is a hook, so a
     helper that called it would break the rules-of-hooks contract,
     and a loop would make the count depend on data. Three layers,
     three pairs, fixed order. */
  const windowX = useTransform(px, [0, 1], [10, -10]);
  const windowY = useTransform(py, [0, 1], [6, -6]);
  const volumeX = useTransform(px, [0, 1], [22, -22]);
  const volumeY = useTransform(py, [0, 1], [13, -13]);
  const poolX = useTransform(px, [0, 1], [38, -38]);
  const poolY = useTransform(py, [0, 1], [23, -23]);

  const still = useMotionValue(0);
  const windowLayer = { x: reduced ? still : windowX, y: reduced ? still : windowY };
  const volumeLayer = { x: reduced ? still : volumeX, y: reduced ? still : volumeY };
  const poolLayer = { x: reduced ? still : poolX, y: reduced ? still : poolY };

  /* the room sinks a little as the page scrolls, which reads as depth */
  const roomY = useTransform(scroll, [0, 1], [0, reduced ? 0 : -70]);
  const roomScale = useTransform(scroll, [0, 1], [1, reduced ? 1 : 1.07]);
  const volumeFade = useTransform(scroll, [0, 0.45], [1, 0.32]);

  const night = phase === "night";

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--surface-void)" }}
    >
      {/* ── 1. GROUND ───────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{ background: GROUND }}
      />

      <motion.div className="absolute inset-0" style={{ y: roomY, scale: roomScale }}>
        {/* ── 2. WINDOW ─────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{
            height: "72%",
            x: windowLayer.x,
            y: windowLayer.y,
            opacity: 0.2 + sun.strength * 0.8,
          }}
        >
          {/* the glazing: tall bays with a mullion between each */}
          <div
            className="absolute inset-0"
            style={{
              background: GLAZING,
              maskImage: GLAZING_MASK,
              WebkitMaskImage: GLAZING_MASK,
            }}
          />
        </motion.div>

        {/* ── 3. VOLUME: light in the air ───────────────────────── */}
        <motion.div
          className="absolute inset-0"
          style={{ x: volumeLayer.x, y: volumeLayer.y, opacity: volumeFade }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                `linear-gradient(${sun.tiltDeg}deg, ` +
                `color-mix(in srgb, var(--light-warm) ${sun.airPercent}%, transparent) 0%, ` +
                `transparent 46%)`,
              transformOrigin: `${sun.x}% 0%`,
            }}
          />
          {/* the beam itself, where the strongest bay lands on the floor */}
          {sun.strength > 0.08 ? (
            <div
              className="absolute inset-0"
              style={{
                background:
                  `conic-gradient(from ${sun.beamDeg}deg at ${sun.x}% -8%, ` +
                  `transparent 0deg, ` +
                  `color-mix(in srgb, var(--light-warm) ${sun.beamPercent}%, transparent) 6deg, ` +
                  `transparent 15deg)`,
                filter: "blur(28px)",
              }}
            />
          ) : null}
        </motion.div>

        {/* ── 4. POOLS: the recessed ceiling lights ─────────────── */}
        <motion.div
          className="absolute inset-0"
          style={{ x: poolLayer.x, y: poolLayer.y }}
        >
          {[
            { left: "18%", top: "26%", size: "46vmax", strength: 1 },
            { left: "74%", top: "44%", size: "38vmax", strength: 0.72 },
            { left: "46%", top: "78%", size: "54vmax", strength: 0.5 },
          ].map((pool, i) => (
            <div
              key={i}
              className="nn-atmo-pool absolute"
              style={{
                left: pool.left,
                top: pool.top,
                width: pool.size,
                height: pool.size,
                translate: "-50% -50%",
                animationDelay: `${i * -9}s`,
                background:
                  `radial-gradient(closest-side, ` +
                  `color-mix(in srgb, var(--light-warm) ${Math.round((5 + sun.lamps * 11) * pool.strength)}%, transparent), ` +
                  `transparent 72%)`,
                filter: "blur(36px)",
              }}
            />
          ))}
        </motion.div>

        {/* ── 5. MOTES: dust in the beam, daylight only ─────────── */}
        {!reduced && !night && sun.strength > 0.12 ? (
          <div
            className="nn-atmo-motes absolute inset-0"
            style={{ opacity: 0.3 + sun.strength * 0.4 }}
          />
        ) : null}
      </motion.div>

      {/* ── 6. GRAIN ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: GRAIN,
          backgroundRepeat: "repeat",
          opacity: night ? 0.055 : 0.035,
          mixBlendMode: "overlay",
        }}
      />

      {/* the vignette that seats the whole room */}
      <div
        className="absolute inset-0"
        style={{ background: VIGNETTE }}
      />
    </div>
  );
}
