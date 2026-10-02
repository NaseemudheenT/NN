"use client";

/**
 * One pointer listener for the whole site.
 *
 * Every glass surface reads --px/--py to place its specular highlight. If
 * each one listened for itself, a page with twelve glass controls would run
 * twelve listeners against one physical mouse. This runs one, writes two
 * custom properties on :root, and lets the cascade do the distribution.
 *
 * Coarse pointers get nothing: there is no cursor to reflect, and a
 * highlight that jumps to wherever the last tap landed is worse than none.
 */

import { useEffect } from "react";

export function usePointer() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const root = document.documentElement;
    let frame = 0;
    let x = 0;
    let y = 0;

    const write = () => {
      frame = 0;
      root.style.setProperty("--px", `${x.toFixed(1)}px`);
      root.style.setProperty("--py", `${y.toFixed(1)}px`);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
