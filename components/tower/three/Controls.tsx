"use client";

import { useEffect } from "react";
import type CameraControls from "camera-controls";

/**
 * NN TOWER — keyboard and touch.
 *
 * ── a building you can only drag is a building half the people cannot use ──
 * Pointer-drag is the only input CameraControls gives for free, which
 * leaves out anyone on a keyboard, anyone using assistive technology, and
 * anyone whose hands do not do a precise drag. Those are not edge cases in
 * a shop.
 *
 * ── the keys map to the building, not to a camera ────────────────────
 * Arrow up and down change FLOOR, because that is the verb in a tower —
 * not "orbit up", which would be a camera control wearing a building
 * costume. Left and right turn you round the building. Enter opens the
 * floor you are on, Escape takes you back to the street.
 *
 * ── touch ────────────────────────────────────────────────────────────
 * One finger turns, two fingers push in. That is the gesture language of
 * every map application on earth and it needs no instruction. What it
 * needs is for the page not to scroll or zoom underneath it, which is why
 * the canvas sets `touch-action: none` and why this hook stops a
 * two-finger pinch from zooming the whole document on iOS.
 */
export function Controls({
  controls,
  onFloorUp,
  onFloorDown,
  onEnter,
  onBack,
  enabled,
}: {
  controls: React.RefObject<CameraControls | null>;
  onFloorUp: () => void;
  onFloorDown: () => void;
  onEnter: () => void;
  onBack: () => void;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      // never steal a key from someone typing in the stylist or the bag
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const c = controls.current;
      switch (e.key) {
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          onFloorUp();
          break;
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          onFloorDown();
          break;
        case "ArrowLeft":
          e.preventDefault();
          c?.rotate(-0.32, 0, true);
          break;
        case "ArrowRight":
          e.preventDefault();
          c?.rotate(0.32, 0, true);
          break;
        case "+":
        case "=":
          e.preventDefault();
          c?.dolly(5, true);
          break;
        case "-":
        case "_":
          e.preventDefault();
          c?.dolly(-5, true);
          break;
        case "Enter":
          onEnter();
          break;
        case "Escape":
          onBack();
          break;
      }
    };

    /* iOS will happily zoom the whole page on a two-finger pinch over a
       canvas, which makes the 3D zoom fight the browser zoom and leaves
       the interface at 1.4x with no way back. */
    const stopGesture = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", onKey);
    document.addEventListener("gesturestart", stopGesture);
    document.addEventListener("gesturechange", stopGesture);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("gesturestart", stopGesture);
      document.removeEventListener("gesturechange", stopGesture);
    };
  }, [controls, onFloorUp, onFloorDown, onEnter, onBack, enabled]);

  return null;
}
