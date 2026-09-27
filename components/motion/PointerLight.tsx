"use client";

/**
 * The light every glass surface catches.
 *
 * One passive listener for the whole document, writing the pointer's position
 * into whichever glass surface it is over as --mx/--my. The specular gradient
 * in the CSS reads those, so the highlight lands where the customer is
 * actually looking.
 *
 * One listener rather than one per component: a page carries dozens of glass
 * surfaces and only ever one of them is under the pointer. Writes go through
 * requestAnimationFrame so moving the pointer cannot outrun the paint, and the
 * whole thing stays off for touch and for reduced motion, where there is
 * nothing to track and nothing to gain.
 */

import { useEffect } from "react";

const SURFACES = ".glass, .nn-field, .nn-hotspot";

export function PointerLight() {
  useEffect(() => {
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!motionOk || !canHover) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let last: HTMLElement | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      pending.el.style.setProperty("--mx", `${pending.x}%`);
      pending.el.style.setProperty("--my", `${pending.y}%`);
      pending = null;
    };

    const onMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(SURFACES) ?? null;

      if (target !== last) {
        // Leave the surface behind lit from its centre, not from wherever the
        // pointer happened to cross its edge.
        last?.style.removeProperty("--mx");
        last?.style.removeProperty("--my");
        last = target;
      }
      if (!target) return;

      const rect = target.getBoundingClientRect();
      pending = {
        el: target,
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
      last?.style.removeProperty("--mx");
      last?.style.removeProperty("--my");
    };
  }, []);

  return null;
}
