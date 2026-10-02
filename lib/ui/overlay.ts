"use client";

import { useEffect, useRef } from "react";

/**
 * The three things every overlay on this site must do, in one place.
 *
 * They are here together because they are one behaviour, not three: an
 * overlay that traps focus but does not close on Escape is a trap, and one
 * that closes on Escape but lets the page behind it scroll is a surface
 * floating over a moving background. Getting any one of them wrong is the
 * difference between a sheet and a cage.
 */

/** Escape closes the topmost overlay. */
export function useEscape(active: boolean, close: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, close]);
}

/**
 * The page behind stops scrolling, and does not jump sideways while it does.
 *
 * Removing the scrollbar removes its width from the viewport, so the layout
 * shifts by 15 px the instant a sheet opens. Padding that width back on is
 * the whole fix, and it is the difference between a sheet that slides over
 * the page and one that shoves it.
 */
export function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [active]);
}

/** Focus moves in when it opens and returns to where it was when it closes. */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const returnTo = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    const first = focusables()[0];
    (first ?? root).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };

    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      returnTo?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
