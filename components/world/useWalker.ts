"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { B, BLOCKERS, EYE, FLOORS, type Rect, type Zone } from "./plan";

/**
 * Walking the building.
 *
 * ── collision ────────────────────────────────────────────────────────
 * Against RECTANGLES and CIRCLES on the plan, not against the mesh. That is
 * a deliberate trade: a plan is what the building actually is, it costs
 * nothing to test, and — the part that matters — it is PREDICTABLE. Mesh
 * collision in a browser gets you caught on a moulding, pushed through a
 * wall at a corner, or stuck on a step; a customer who gets stuck once in a
 * shop does not walk around it again.
 *
 * The axes are resolved separately so that walking into a wall at an angle
 * SLIDES along it instead of stopping dead. That one detail is most of the
 * difference between a space that feels like a place and one that feels
 * like a cage.
 *
 * ── the stair ────────────────────────────────────────────────────────
 * Height is a continuous function of position, not a floor number: inside
 * the stair's footprint the eye rises with z, everywhere else it sits on
 * whichever level you last left the stair at. So you can stop halfway up
 * and look down into the nave, which is the whole reason a gallery is worth
 * having.
 */

const RADIUS = 0.42;       // the customer's own footprint
const SPEED = 3.1;         // metres per second, an unhurried walk
const RUN = 5.4;
const ACCEL = 11;
const LOOK = 0.0024;       // radians per pixel
const PITCH_LIMIT = Math.PI / 2 - 0.12;

const STAIR: Rect = {
  x0: B.stair.x - B.stair.width / 2,
  x1: B.stair.x + B.stair.width / 2,
  z0: B.stair.topZ,
  z1: B.stair.bottomZ,
};

const inRect = (x: number, z: number, r: Rect) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;

const onStair = (x: number, z: number) => inRect(x, z, STAIR);

/** How high the floor is under a given point, 0 at the ground, 1 at the gallery. */
function levelAt(x: number, z: number, carried: number): number {
  if (!onStair(x, z)) return carried;
  const t = (B.stair.bottomZ - z) / (B.stair.bottomZ - B.stair.topZ);
  return THREE.MathUtils.clamp(t, 0, 1);
}

function walkable(x: number, z: number, level: number): boolean {
  if (onStair(x, z)) return true;
  const floor = FLOORS[level > 0.5 ? 1 : 0];
  for (const a of floor.areas) if (inRect(x, z, a)) return true;
  return false;
}

export interface WalkerState {
  /** Called once per frame with the eye transform. */
  eye: THREE.Vector3;
  yaw: number;
  pitch: number;
  /** 0 on the ground floor, 1 in the gallery, fractional on the stair. */
  level: number;
  moving: boolean;
}

export function useWalker({
  enabled,
  start,
}: {
  enabled: boolean;
  start: Zone;
}) {
  const state = useRef<WalkerState>({
    eye: new THREE.Vector3(start.at[0], EYE, start.at[1]),
    yaw: start.yaw,
    pitch: 0,
    level: start.floor,
    moving: false,
  });

  const keys = useRef(new Set<string>());
  const velocity = useRef(new THREE.Vector2());
  const look = useRef({ dragging: false, lastX: 0, lastY: 0, id: -1 });
  const stick = useRef({ active: false, id: -1, x0: 0, y0: 0, dx: 0, dy: 0 });

  /* A glide to a zone. While it runs, input is ignored and the camera
     travels — it is a walk at speed, not a cut, because a cut loses the
     customer's sense of where they are in the building. */
  const glide = useRef<{
    from: THREE.Vector3; to: THREE.Vector3;
    fromYaw: number; toYaw: number;
    fromLevel: number; toLevel: number;
    t: number; duration: number;
  } | null>(null);

  const teleport = useCallback((zone: Zone) => {
    const s = state.current;
    const to = new THREE.Vector3(zone.at[0], EYE + zone.floor * B.gallery.y, zone.at[1]);
    const distance = Math.hypot(to.x - s.eye.x, to.z - s.eye.z) + Math.abs(to.y - s.eye.y);
    /* Longer journeys take longer, but with a ceiling — nobody wants to
       wait eight seconds to cross a room they could have walked. */
    const duration = THREE.MathUtils.clamp(0.55 + distance * 0.055, 0.7, 2.4);

    /* Take the shortest way round the circle. Without this, turning from
       +170° to -170° spins the customer 340° through the whole building. */
    let toYaw = zone.yaw;
    const delta = ((toYaw - s.yaw + Math.PI) % (Math.PI * 2)) - Math.PI;
    toYaw = s.yaw + (delta < -Math.PI ? delta + Math.PI * 2 : delta);

    glide.current = {
      from: s.eye.clone(), to,
      fromYaw: s.yaw, toYaw,
      fromLevel: s.level, toLevel: zone.floor,
      t: 0, duration,
    };
  }, []);

  /* ── input ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!enabled) return;

    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return;
      keys.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();

    const held = keys.current;
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      /* Captured on the way in: by cleanup time the ref may point somewhere
         else, and the set we must clear is the one these handlers filled. */
      held.clear();
    };
  }, [enabled]);

  /** Attached to the canvas's own element by the scene. */
  const pointerHandlers = useMemo(
    () => ({
      onPointerDown(e: PointerEvent, isTouch: boolean) {
        if (isTouch && e.clientX < window.innerWidth * 0.45) {
          stick.current = { active: true, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
          return;
        }
        look.current = { dragging: true, lastX: e.clientX, lastY: e.clientY, id: e.pointerId };
      },
      onPointerMove(e: PointerEvent) {
        if (stick.current.active && e.pointerId === stick.current.id) {
          stick.current.dx = THREE.MathUtils.clamp((e.clientX - stick.current.x0) / 70, -1, 1);
          stick.current.dy = THREE.MathUtils.clamp((e.clientY - stick.current.y0) / 70, -1, 1);
          return;
        }
        if (!look.current.dragging || e.pointerId !== look.current.id) return;
        const s = state.current;
        s.yaw -= (e.clientX - look.current.lastX) * LOOK;
        s.pitch = THREE.MathUtils.clamp(
          s.pitch - (e.clientY - look.current.lastY) * LOOK,
          -PITCH_LIMIT,
          PITCH_LIMIT,
        );
        look.current.lastX = e.clientX;
        look.current.lastY = e.clientY;
      },
      onPointerUp(e: PointerEvent) {
        if (e.pointerId === stick.current.id) stick.current = { active: false, id: -1, x0: 0, y0: 0, dx: 0, dy: 0 };
        if (e.pointerId === look.current.id) look.current.dragging = false;
      },
    }),
    [],
  );

  /** One step of the simulation. Called from the scene's frame loop. */
  const step = useCallback(
    (dt: number) => {
      const s = state.current;
      const d = Math.min(dt, 0.05); // a tab that was hidden must not teleport the walker

      /* a glide in progress owns the camera */
      const g = glide.current;
      if (g) {
        g.t = Math.min(1, g.t + d / g.duration);
        /* ease-in-out quint: leaves slowly, arrives slowly, moves fast in
           between — the shape of a walk, not of a slide */
        const e = g.t < 0.5 ? 16 * g.t ** 5 : 1 - Math.pow(-2 * g.t + 2, 5) / 2;
        s.eye.lerpVectors(g.from, g.to, e);
        s.yaw = g.fromYaw + (g.toYaw - g.fromYaw) * e;
        s.level = g.fromLevel + (g.toLevel - g.fromLevel) * e;
        s.moving = true;
        if (g.t >= 1) glide.current = null;
        return;
      }

      /* intent, in the walker's own frame */
      const k = keys.current;
      let fwd = 0;
      let strafe = 0;
      if (k.has("w") || k.has("arrowup")) fwd += 1;
      if (k.has("s") || k.has("arrowdown")) fwd -= 1;
      if (k.has("a") || k.has("arrowleft")) strafe -= 1;
      if (k.has("d") || k.has("arrowright")) strafe += 1;
      if (stick.current.active) {
        fwd -= stick.current.dy;
        strafe += stick.current.dx;
      }

      const len = Math.hypot(fwd, strafe);
      if (len > 1) { fwd /= len; strafe /= len; }

      const speed = k.has("shift") ? RUN : SPEED;
      const sin = Math.sin(s.yaw);
      const cos = Math.cos(s.yaw);
      /* yaw 0 looks down -z, so forward is (-sin, -cos) */
      const target = new THREE.Vector2(
        (-sin * fwd + cos * strafe) * speed,
        (-cos * fwd - sin * strafe) * speed,
      );

      /* acceleration rather than instant velocity — a body has mass */
      const a = 1 - Math.exp(-ACCEL * d);
      velocity.current.lerp(target, a);
      s.moving = velocity.current.lengthSq() > 0.04;

      /* ── resolve, one axis at a time, so walls are slid along ──── */
      let nx = s.eye.x + velocity.current.x * d;
      let nz = s.eye.z + velocity.current.y * d;
      const level = s.level;

      if (!walkable(nx, s.eye.z, level)) { nx = s.eye.x; velocity.current.x = 0; }
      if (!walkable(nx, nz, level)) { nz = s.eye.z; velocity.current.y = 0; }

      /* ── push out of the fittings ───────────────────────────── */
      const floorIndex = level > 0.5 ? 1 : 0;
      for (const b of BLOCKERS) {
        if (b.floor !== floorIndex) continue;
        const dx = nx - b.x;
        const dz = nz - b.z;
        const dist = Math.hypot(dx, dz);
        const min = b.r + RADIUS;
        if (dist < min && dist > 1e-4) {
          nx = b.x + (dx / dist) * min;
          nz = b.z + (dz / dist) * min;
        }
      }

      s.eye.x = nx;
      s.eye.z = nz;
      s.level = levelAt(nx, nz, level);
      /* the eye floats up the stair rather than stepping, which reads as
         walking; stepping each tread reads as a lift */
      const floorY = s.level * B.gallery.y;
      s.eye.y += (floorY + EYE - s.eye.y) * (1 - Math.exp(-9 * d));
    },
    [],
  );

  return { state, step, teleport, pointerHandlers };
}
