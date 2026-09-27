"use client";

/**
 * The living logo, with an honest fallback.
 *
 * three.js is only fetched when the logo is actually going to move: with reduced
 * motion, or before the canvas arrives, the flat SVG monogram stands in. It is
 * the same letterform either way, so nothing shifts when the 3D takes over.
 */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDayPhase } from "@/components/theme/ThemeProvider";
import { LogoMark } from "./LogoMark";

const LiveLogoScene = dynamic(() => import("./LiveLogoScene"), {
  ssr: false,
  loading: () => null,
});

export function LiveLogo({
  /** Side of the square the logo occupies. */
  size = 280,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const { reducedMotion, phase } = useDayPhase();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const use3D = mounted && !reducedMotion;

  return (
    <div
      className={`relative grid place-items-center ${className}`}
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      {/* The flat mark. Visible until the canvas is up, and the only version
          shown when the visitor has asked for less motion. */}
      <div
        className="transition-opacity duration-700"
        style={{ opacity: use3D ? 0 : 1 }}
        aria-hidden={use3D}
      >
        <LogoMark size={size * 0.42} shimmer={!reducedMotion} />
      </div>

      {use3D ? <LiveLogoScene reducedMotion={reducedMotion} /> : null}

      <p className="sr-only">
        The Nero Noren monogram: two interlocked serif Ns in gold, inside a thin ring.
        {use3D ? " Drag to turn it." : null}
      </p>

      {use3D ? (
        <p
          className="pointer-events-none absolute -bottom-7 left-0 right-0 text-center text-[0.62rem] uppercase tracking-[0.2em] transition-opacity duration-700"
          style={{ color: "var(--ink-faint)", opacity: phase === "night" ? 0.8 : 0.6 }}
        >
          Drag to turn the NN button
        </p>
      ) : null}
    </div>
  );
}
