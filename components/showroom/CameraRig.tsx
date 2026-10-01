"use client";

/**
 * The camera.
 *
 * Four things separate a camera being carried from a value being interpolated,
 * and this rig does all four.
 *
 *  · IT WALKS ROUND THINGS. A move follows a path routed through the open
 *    floor rather than a straight line between two viewpoints. Measured
 *    against the room as built, four of the twenty moves crossed furniture if
 *    interpolated straight, two of them passing INSIDE it — the entrance to
 *    the mirror went through the trousers table, and the shirts to the fitting
 *    room went through a dressed mannequin. See ./choreography, and
 *    `npm run showroom:check`, which fails the build if that comes back.
 *
 *  · THE HEAD AND THE FEET DISAGREE. A person looks where they are going
 *    before they get there, then turns to the thing as they arrive. So on a
 *    long move the eyes go to a point further down the path first and only
 *    then to the subject, and on a short one they lag the body a little and
 *    settle before it stops. Panning and dollying in lockstep is the single
 *    clearest sign of a camera on rails.
 *
 *  · DISTANCE AND TURN SET THE PACE. Stepping to the next rail is quick;
 *    crossing the room is not; and turning 180° from the shirts to the
 *    trousers takes longer than the three metres it covers.
 *
 *  · IT HAS A GAIT. While travelling there is a slight vertical bob at
 *    walking frequency, which fades back to the standing breath on arrival.
 *    A centimetre is plenty — this is the difference between a shot and a
 *    screenshot, and any more is motion sickness.
 *
 * With reduced motion none of it runs: the entry is skipped and every move
 * is a cut.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { exposeCamera } from "./devCamera";
import gsap from "gsap";
import { INTRO, type Viewpoint } from "./viewpoints";
import {
  LOOK_AHEAD_FROM,
  curveBetween,
  lookAheadPoint,
  moveDuration,
  sweepBetween,
} from "./choreography";

interface CameraRigProps {
  viewpoint: Viewpoint;
  /** Play the one-time entry move. */
  intro: boolean;
  reducedMotion: boolean;
  onIntroDone?: () => void;
  /** 0–1 how much the visitor may look around. */
  lookAmount?: number;
}

/** Walking frequency, in steps per second. A slow showroom pace. */
const GAIT_HZ = 1.9;
/** How far the camera rises and falls per step, in metres. */
const GAIT_RISE = 0.011;

export function CameraRig({
  viewpoint,
  intro,
  reducedMotion,
  onIntroDone,
  lookAmount = 1,
}: CameraRigProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  /** The animated values. GSAP writes here; useFrame reads.

      `u` is distance along the current path, 0–1, rather than a position:
      the path is a curve, so the camera is dragged along it instead of
      being tweened toward a point. */
  const rig = useRef({
    u: 1,
    tx: INTRO.to.target[0],
    ty: INTRO.to.target[1],
    tz: INTRO.to.target[2],
    fov: INTRO.from.fov,
    /** 0 standing, 1 walking. Drives the bob. */
    gait: 0,
  });

  /** The path the camera is currently on. */
  const path = useRef<THREE.CatmullRomCurve3>(
    curveBetween(INTRO.from.position, INTRO.from.position),
  );

  const look = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const introPlayed = useRef(false);
  /** True while the entry move owns the camera, so nothing else tweens it. */
  const introRunning = useRef(intro);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  /** Reused every frame — allocating a vector 60 times a second is pure waste. */
  const scratch = useRef({ eye: new THREE.Vector3(), target: new THREE.Vector3() });

  /* The callback is held in a ref rather than listed as a dependency. It
     usually arrives as an inline arrow, so depending on it would re-run the
     effect below on every render — killing the entry move each time, and then
     being blocked by introPlayed for good. */
  const introDone = useRef(onIntroDone);
  introDone.current = onIntroDone;

  /* A handle on the camera for in-browser verification. Development only. */
  useEffect(() => exposeCamera(camera, "viewpoint"), [camera]);

  /* the visitor's small look-around, from the pointer */
  useEffect(() => {
    if (reducedMotion) return;
    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [reducedMotion]);

  /** Park the camera somewhere with no animation at all.

      A curve from a point to itself has zero length, which three.js resolves
      to that point rather than to NaN — so a parked camera is just a path it
      has already finished walking, and the frame loop needs no special case. */
  const cut = (to: { position: readonly [number, number, number]; target: readonly [number, number, number]; fov: number }) => {
    path.current = curveBetween(to.position, to.position);
    Object.assign(rig.current, {
      u: 1,
      tx: to.target[0], ty: to.target[1], tz: to.target[2],
      fov: to.fov,
      gait: 0,
    });
  };

  /**
   * Walk to a viewpoint.
   *
   * One timeline carries the body, the eyes and the gait, so they can be
   * offset against each other and still finish together.
   */
  const walkTo = (
    from: readonly [number, number, number],
    to: Viewpoint | typeof INTRO.to,
    fromTarget: readonly [number, number, number],
    fromFov: number,
    duration: number,
    onComplete?: () => void,
  ) => {
    const curve = curveBetween(from, to.position);
    path.current = curve;
    rig.current.u = 0;
    rig.current.fov = fromFov;
    Object.assign(rig.current, { tx: fromTarget[0], ty: fromTarget[1], tz: fromTarget[2] });

    timeline.current?.kill();
    const tl = gsap.timeline({ onComplete });
    timeline.current = tl;

    // the body
    tl.to(rig.current, { u: 1, duration, ease: "power2.inOut" }, 0);
    tl.to(rig.current, { fov: to.fov, duration, ease: "power2.inOut" }, 0);

    // the gait: up to a walk, hold, and back down to standing
    tl.to(
      rig.current,
      {
        keyframes: [
          { gait: 1, duration: duration * 0.28, ease: "power1.out" },
          { gait: 1, duration: duration * 0.42 },
          { gait: 0, duration: duration * 0.3, ease: "power1.in" },
        ],
      },
      0,
    );

    // the eyes
    const far = curve.getLength() >= LOOK_AHEAD_FROM;
    if (far) {
      // Look down the path first, then turn to the subject on arrival.
      const [ax, ay, az] = lookAheadPoint(curve, (from[1] + to.position[1]) / 2);
      tl.to(
        rig.current,
        { tx: ax, ty: ay, tz: az, duration: duration * 0.42, ease: "power1.inOut" },
        duration * 0.04,
      );
      tl.to(
        rig.current,
        {
          tx: to.target[0], ty: to.target[1], tz: to.target[2],
          duration: duration * 0.5,
          ease: "power2.out",
        },
        duration * 0.48,
      );
    } else {
      // A short step: the head simply lags the feet and settles first.
      tl.to(
        rig.current,
        {
          tx: to.target[0], ty: to.target[1], tz: to.target[2],
          duration: duration * 0.8,
          ease: "power2.out",
        },
        duration * 0.12,
      );
    }
  };

  /* the entry move, once */
  useEffect(() => {
    if (!intro || introPlayed.current) return;
    introPlayed.current = true;

    if (reducedMotion) {
      cut({ position: INTRO.to.position, target: INTRO.to.target, fov: INTRO.to.fov });
      introRunning.current = false;
      introDone.current?.();
      return;
    }

    walkTo(
      INTRO.from.position,
      INTRO.to,
      INTRO.to.target,
      INTRO.from.fov,
      INTRO.duration,
      () => {
        introRunning.current = false;
        introDone.current?.();
      },
    );

    return () => {
      timeline.current?.kill();
      // Let a genuine remount play the entry again, rather than leaving the
      // camera parked wherever the killed timeline stopped.
      introPlayed.current = false;
      introRunning.current = intro;
    };
  }, [intro, reducedMotion]);

  /* moving between viewpoints */
  useEffect(() => {
    // The entry move owns the camera until it finishes; without this the
    // viewpoint move would start on mount and cut the entry short.
    if (introRunning.current) return;

    if (reducedMotion) {
      cut(viewpoint);
      return;
    }

    // Where we are now, which is wherever the last move left the camera —
    // possibly mid-flight, so it is read off the path rather than assumed.
    const eye = path.current.getPointAt(THREE.MathUtils.clamp(rig.current.u, 0, 1));
    const from: [number, number, number] = [eye.x, eye.y, eye.z];
    const fromTarget: [number, number, number] = [rig.current.tx, rig.current.ty, rig.current.tz];

    const sweep = sweepBetween(from, fromTarget, viewpoint.position, viewpoint.target);
    const metres = curveBetween(from, viewpoint.position).getLength();

    walkTo(from, viewpoint, fromTarget, rig.current.fov, moveDuration(metres, sweep));

    return () => {
      timeline.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewpoint.id, reducedMotion]);

  /* apply, every frame */
  useFrame((_, delta) => {
    const r = rig.current;
    const k = Math.min(1, delta * 4);
    const { eye, target } = scratch.current;

    // ease the look-around toward the pointer
    look.current.x += (pointer.current.x * 0.22 * lookAmount - look.current.x) * k;
    look.current.y += (pointer.current.y * 0.12 * lookAmount - look.current.y) * k;

    path.current.getPointAt(THREE.MathUtils.clamp(r.u, 0, 1), eye);
    camera.position.copy(eye);

    if (!reducedMotion) {
      const t = performance.now() / 1000;
      // Standing: a breath of a couple of centimetres, so a held shot is not
      // a screenshot. It recedes as the walk takes over.
      const still = 1 - r.gait * 0.6;
      camera.position.x += Math.sin(t * 0.31) * 0.012 * still;
      camera.position.y += Math.sin(t * 0.47 + 1.2) * 0.008 * still;
      // Walking: a rise and fall at step frequency. Two steps per stride, so
      // the vertical runs at twice the gait and the sway at once.
      camera.position.y += Math.sin(t * Math.PI * 2 * GAIT_HZ) * GAIT_RISE * r.gait;
      camera.position.x += Math.sin(t * Math.PI * GAIT_HZ) * GAIT_RISE * 0.5 * r.gait;
    }

    target.set(
      r.tx + look.current.x * 1.6,
      r.ty - look.current.y * 0.9,
      r.tz,
    );
    camera.lookAt(target);

    // A narrow phone needs a wider lens to show the same amount of room.
    const aspect = size.width / Math.max(1, size.height);
    const portraitCompensation = aspect < 0.9 ? (0.9 - aspect) * 26 : 0;
    const fov = r.fov + portraitCompensation;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
