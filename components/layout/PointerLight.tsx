"use client";

/**
 * The light the glass catches.
 *
 * One passive pointermove listener for the whole page, which writes the
 * pointer's position into the hovered control as --mx/--my. The specular
 * highlight in the CSS reads those, so every glass surface catches the light
 * where the customer is actually looking.
 *
 * One listener rather than one per button: fifty buttons with their own
 * handlers is fifty closures and fifty subscriptions for an effect that is
 * only ever visible on one of them at a time. Writes go through
 * requestAnimationFrame, so moving the pointer cannot outrun the paint.
 */

import { useEffect } from "react";

const GLASS = ".nn-btn, .nn-field, .nn-hotspot, .nn-plate";

export function PointerLight() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A finger has no hover, so there is no highlight to track.
    if (window.matchMedia("(hover: none)").matches) return;

    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let last: HTMLElement | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
      pending = null;
    };

    const onMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(GLASS) ?? null;

      if (target !== last) {
        // Leave the previous surface lit from its centre, not wherever the
        // pointer happened to exit.
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
