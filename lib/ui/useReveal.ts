"use client";

/**
 * Section entrances.
 *
 * One IntersectionObserver for the page, watching every .reveal. The element
 * is already in the DOM and already readable — the only thing the observer
 * changes is opacity and an 18px translate — so a failed observer, a
 * disabled script or `prefers-reduced-motion` all leave the content fully
 * available rather than invisible. That is the whole reason this is a data
 * attribute on a visible element rather than a mount.
 */

import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
    const seen = new WeakSet<Element>();

    const show = (el: Element) => {
      if (seen.has(el)) return;
      seen.add(el);
      (el as HTMLElement).dataset.shown = "true";
    };

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(show);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const attach = () => document.querySelectorAll(".reveal:not([data-shown])").forEach((el) => io.observe(el));
    attach();

    /* Routes swap content under us; re-scan when the tree changes. */
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
