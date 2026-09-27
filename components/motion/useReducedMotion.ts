"use client";

import { useEffect, useState } from "react";

/**
 * Whether this visitor has asked for less movement.
 *
 * Framer Motion has its own hook, but it returns null on the first render and
 * that null has to be handled at every call site. This returns a boolean from
 * the start — false on the server, corrected on mount — so components can
 * branch on it without a three-way check.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return reduced;
}

/** Whether this device has a real pointer that can hover. */
export function useHasHover(): boolean {
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHover(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return hover;
}
