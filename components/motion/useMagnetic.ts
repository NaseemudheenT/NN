"use client";

/**
 * Magnetic hover.
 *
 * The control leans a little toward the pointer while it is over it, and
 * springs back when it leaves. The effect is small on purpose: past about
 * eight pixels it stops reading as attraction and starts reading as a bug.
 *
 * Returns motion values rather than state, so the movement never costs a React
 * render — sixty renders a second to move something four pixels is how an
 * interface starts dropping frames.
 */

import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { useCallback, useRef } from "react";
import { SPRING } from "@/lib/motion";
import { useHasHover, usePrefersReducedMotion } from "./useReducedMotion";

export interface Magnetic {
  x: MotionValue<number>;
  y: MotionValue<number>;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerLeave: () => void;
  /** True when the effect is actually running. */
  active: boolean;
}

export function useMagnetic(strength = 6): Magnetic {
  const reduced = usePrefersReducedMotion();
  const hasHover = useHasHover();
  const active = hasHover && !reduced;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING.magnetic);
  const y = useSpring(rawY, SPRING.magnetic);
  const frame = useRef(0);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!active) return;
      const el = event.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();

      // Offset from the centre, normalised, then scaled. Clamped so a very
      // wide control does not develop a long throw at its edges.
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        rawX.set(Math.max(-1, Math.min(1, dx)) * strength);
        rawY.set(Math.max(-1, Math.min(1, dy)) * strength);
        frame.current = 0;
      });
    },
    [active, rawX, rawY, strength],
  );

  const onPointerLeave = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { x, y, onPointerMove, onPointerLeave, active };
}
