import * as THREE from "three";
import { EYE, FACADE } from "./plan";

/**
 * The arrival.
 *
 * Three movements, nine seconds, and the only one that has to be beautiful
 * is the first.
 *
 *   ORBIT     5.0s   a wide, slow sweep around the facade, descending
 *   APPROACH  1.9s   the push to the doors — fast, and it should feel fast
 *   THROUGH   2.4s   doors give, camera crosses the threshold, control
 *
 * ── why it is written as a sampled path ──────────────────────────────
 * Not as a timeline of tweens on the camera object. A sampled path is a
 * pure function of t: given a time it returns a position and a target and
 * nothing else in the program has to have happened first. That means it
 * can be scrubbed, skipped to the end, resumed after a hidden tab, or cut
 * short by a returning visitor pressing Skip — all by moving one number.
 * A tween timeline can do none of those without unwinding state.
 *
 * ── the descent ──────────────────────────────────────────────────────
 * Height falls from 15 m to eye level across the whole sequence and the
 * orbit radius closes as it goes. A camera that holds its altitude and then
 * drops at the end reads as a drone landing; one that is always descending
 * reads as an approach, which is what this is.
 */

export const INTRO = {
  orbit: 5.0,
  approach: 1.9,
  through: 2.4,
} as const;

export const INTRO_TOTAL = INTRO.orbit + INTRO.approach + INTRO.through;

export interface Shot {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  /** True once the doors should be swinging. */
  doorsOpen: boolean;
}

const centre = new THREE.Vector3(0, 7.5, FACADE.z);
const doorEye = new THREE.Vector3(0, 2.5, FACADE.z + 7.2);
const doorLook = new THREE.Vector3(0, 3.4, FACADE.z - 2);
const insideEye = new THREE.Vector3(0, EYE, 12.6);
const insideLook = new THREE.Vector3(0, 4.2, -10);

const easeInOut = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - Math.pow(-2 * v + 2, 3) / 2);
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);
const easeIn = (v: number) => v * v * v;

/* Where the orbit ends. Computed once, at module load, because the
   approach needs it on every frame and re-deriving it meant calling this
   function recursively sixty times a second and allocating a Shot each
   time — a garbage-collection pause in the middle of the one shot in the
   whole site that has to be smooth. */
const ORBIT_END = new THREE.Vector3();
{
  const angle = THREE.MathUtils.degToRad(64);
  ORBIT_END.set(Math.sin(angle) * 31, 10.3, FACADE.z + Math.cos(angle) * 31);
}

/** The whole arrival, as a function of seconds since it began. */
export function introShot(time: number, out?: Shot): Shot {
  const shot: Shot =
    out ?? { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 52, doorsOpen: false };

  /* ── 1. the orbit ──────────────────────────────────────────── */
  if (time < INTRO.orbit) {
    const t = time / INTRO.orbit;
    const e = easeInOut(t);
    /* 128° of sweep. A full circle would show the back of a building that
       has no back, and would take the entrance out of frame for half the
       shot — the entrance is the subject. */
    const angle = THREE.MathUtils.degToRad(-64 + 128 * e);
    const radius = 42 - 11 * e;
    const height = 15.5 - 5.2 * e;
    shot.position.set(
      Math.sin(angle) * radius,
      height,
      FACADE.z + Math.cos(angle) * radius,
    );
    shot.target.copy(centre);
    shot.fov = 52 - 4 * e;
    shot.doorsOpen = false;
    return shot;
  }

  /* ── 2. the approach ───────────────────────────────────────── */
  if (time < INTRO.orbit + INTRO.approach) {
    const t = (time - INTRO.orbit) / INTRO.approach;
    const e = easeIn(t); // accelerating: the push should feel like a push
    shot.position.lerpVectors(ORBIT_END, doorEye, e);
    shot.target.lerpVectors(centre, doorLook, easeOut(t));
    shot.fov = 48 + 8 * e; // widening as it closes, which reads as speed
    /* The doors start giving BEFORE the camera arrives. A door that waits
       until you are standing at it is a door being operated by the
       building; one that opens as you come up the steps is a door being
       opened for you. */
    shot.doorsOpen = t > 0.45;
    return shot;
  }

  /* ── 3. through ────────────────────────────────────────────── */
  const t = Math.min(1, (time - INTRO.orbit - INTRO.approach) / INTRO.through);
  const e = easeOut(t);
  shot.position.lerpVectors(doorEye, insideEye, e);
  shot.target.lerpVectors(doorLook, insideLook, easeInOut(t));
  shot.fov = 56 + 6 * e;
  shot.doorsOpen = true;
  return shot;
}

/** Where the walker should be standing when the camera is handed back. */
export const INTRO_LANDING = {
  at: [insideEye.x, insideEye.z] as [number, number],
  yaw: 0,
  floor: 0,
};
