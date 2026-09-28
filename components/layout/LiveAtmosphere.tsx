"use client";

import { useEffect, useRef } from "react";
import { useShowroom } from "./ShowroomProvider";

/**
 * The air of the building. It is present on every page, behind everything,
 * and it moves slowly enough that you notice it only when you look.
 *
 * It leans very slightly toward whatever garment is under the light —
 * a warmer room for a warmer cloth — never enough to read as a theme change.
 */
export function LiveAtmosphere() {
  const { phase, focus, reducedMotion } = useShowroom();
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 50, y: 42 });
  const current = useRef({ x: 50, y: 42 });
  const raf = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 100;
      target.current.y = (e.clientY / window.innerHeight) * 100;
    };

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.035;
      current.current.y += (target.current.y - current.current.y) * 0.035;
      el.style.setProperty("--ax", `${current.current.x.toFixed(2)}%`);
      el.style.setProperty("--ay", `${current.current.y.toFixed(2)}%`);
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [reducedMotion]);

  const night = phase === "night";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ ["--ax" as string]: "50%", ["--ay" as string]: "42%" }}
    >
      {/* the ground colour of the room */}
      <div className="absolute inset-0 bg-bg transition-[background-color] duration-[1600ms]" />

      {/* light falling through the tall windows */}
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms]"
        style={{
          opacity: night ? 0.35 : 0.95,
          background: night
            ? "linear-gradient(200deg, rgba(122,146,178,0.10) 0%, transparent 42%)"
            : "linear-gradient(200deg, color-mix(in srgb, var(--bg-elev) 90%, white) 0%, transparent 46%)",
        }}
      />

      {/* a pool of lamp light that follows the pointer, very slowly */}
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms]"
        style={{
          opacity: night ? 0.55 : 0.32,
          background: `radial-gradient(48rem 34rem at var(--ax) var(--ay), ${
            focus
              ? `color-mix(in srgb, ${focus.swatch} 26%, var(--accent))`
              : "var(--accent)"
          }, transparent 68%)`,
          filter: "blur(28px)",
          mixBlendMode: night ? "screen" : "multiply",
        }}
      />

      {/* the floor plane, so the page has a horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-[46vh] transition-[background] duration-[1600ms]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--bg-deep) 88%, transparent) 100%)",
        }}
      />

      {/* structural shadow at the top, where the ceiling is */}
      <div
        className="absolute inset-x-0 top-0 h-[22vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--bg-deep) 70%, transparent) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
