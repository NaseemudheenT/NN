"use client";

/**
 * Turning on the spot — a full 360° of the room from wherever you stand.
 *
 * The camera already walks between five composed viewpoints. This lets the
 * visitor turn their head once they get there, all the way round, by dragging.
 *
 * ── why this is safe where free flight is not ────────────────────────
 * The reason the rig never offered free movement is that a camera able to go
 * anywhere ends up inside a wall, and a room has no inside. Rotation has no
 * such problem: the viewpoints are already verified clear of every obstacle by
 * `npm run showroom:check`, so turning on the spot cannot collide with
 * anything. Yaw is therefore completely free — a real 360°, not a wide arc —
 * and only the pitch is bounded.
 *
 * Pitch stops at −32° and +38°. Not to restrict anyone: past about forty
 * degrees you are looking at bare ceiling or bare floor, both of which are
 * correctly modelled and neither of which is worth seeing, and beyond that a
 * camera with a fixed up-vector starts to roll, which reads as the room
 * tipping over.
 *
 * ── it has to feel like a head, not a slider ─────────────────────────
 * Three things do that. Drag moves the view one-to-one with the pointer, so
 * the room tracks the hand exactly. Letting go keeps the motion and lets it
 * run down, because a head that stops dead the instant you release it feels
 * mechanical. And the whole thing is damped rather than applied raw, so a
 * jittery trackpad does not shake the building.
 *
 * ── and it must not fight the page ───────────────────────────────────
 * On a phone, a vertical swipe is how you scroll. Grabbing every touch would
 * trap the visitor in the room with no way out, so a touch only becomes a
 * drag once it has travelled far enough horizontally to be unambiguous — the
 * same rule a photo carousel uses, and for the same reason.
 */

import { useCallback, useEffect, useRef } from "react";

export interface OrbitState {
  /** Accumulated yaw in radians. Unbounded: the room goes all the way round. */
  yaw: number;
  /** Pitch in radians, clamped. */
  pitch: number;
  /** Live velocity, so release coasts instead of stopping dead. */
  vYaw: number;
  vPitch: number;
  /** True while a pointer is actually dragging the view. */
  dragging: boolean;
}

/** Radians per pixel. 0.0042 puts a full turn at roughly 1500 px of drag. */
const SENSITIVITY = 0.0042;
/** Pitch limits. Past these there is only ceiling or floor. */
export const PITCH_MIN = -0.558; // −32°
export const PITCH_MAX = 0.663; //  +38°
/** How fast a release runs down. 0.92 per frame is a hand slowing, not a brake. */
const FRICTION = 0.92;
/** Below this the coast is over; snapping to zero avoids endless tiny updates. */
const REST = 0.00018;
/** Pixels of travel before a touch is a drag rather than a scroll. */
const TOUCH_SLOP = 10;

export function useOrbit(enabled: boolean) {
  const state = useRef<OrbitState>({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, dragging: false });
  const last = useRef<{ x: number; y: number; id: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const committed = useRef(false);

  /* Reset when the visitor is walked somewhere else. Keeping the old angle
     would land them at the mirror facing a wall, having never asked to. */
  const recentre = useCallback(() => {
    const s = state.current;
    s.yaw = 0;
    s.pitch = 0;
    s.vYaw = 0;
    s.vPitch = 0;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onDown = (e: PointerEvent) => {
      // Left button or touch only; a right-click is a context menu.
      if (e.button !== 0) return;
      start.current = { x: e.clientX, y: e.clientY };
      last.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      /* A mouse or pen is deliberate the moment it goes down. A touch has
         to prove itself first, or the page can never be scrolled. */
      committed.current = e.pointerType !== "touch";
      if (committed.current) state.current.dragging = true;
    };

    const onMove = (e: PointerEvent) => {
      const l = last.current;
      if (!l || l.id !== e.pointerId) return;

      const dx = e.clientX - l.x;
      const dy = e.clientY - l.y;

      if (!committed.current && start.current) {
        const travelX = Math.abs(e.clientX - start.current.x);
        const travelY = Math.abs(e.clientY - start.current.y);
        if (travelX < TOUCH_SLOP && travelY < TOUCH_SLOP) return;
        /* Mostly vertical means they are scrolling the page. Let go of the
           gesture entirely rather than half-turning the room on the way. */
        if (travelY > travelX) {
          last.current = null;
          start.current = null;
          return;
        }
        committed.current = true;
        state.current.dragging = true;
      }

      const s = state.current;
      s.yaw -= dx * SENSITIVITY;
      s.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, s.pitch - dy * SENSITIVITY));
      /* Velocity for the coast. Taken from the raw delta rather than
         smoothed, so a flick throws further than a push. */
      s.vYaw = -dx * SENSITIVITY;
      s.vPitch = -dy * SENSITIVITY;
      last.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };

    const onUp = () => {
      last.current = null;
      start.current = null;
      committed.current = false;
      state.current.dragging = false;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [enabled]);

  /** Advance the coast. Called once per frame by the rig. */
  const settle = useCallback(() => {
    const s = state.current;
    if (s.dragging) return s;

    if (Math.abs(s.vYaw) > REST || Math.abs(s.vPitch) > REST) {
      s.yaw += s.vYaw;
      s.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, s.pitch + s.vPitch));
      s.vYaw *= FRICTION;
      s.vPitch *= FRICTION;
    } else {
      s.vYaw = 0;
      s.vPitch = 0;
    }
    return s;
  }, []);

  return { state, settle, recentre };
}
