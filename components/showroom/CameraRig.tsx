"use client";

/**
 * The camera.
 *
 * Moves between fixed viewpoints on a GSAP timeline, easing position, target
 * and focal length together so a move reads as a camera being carried rather
 * than a value being interpolated. A small amount of hand-held drift keeps the
 * held shot alive; a visitor can also look around by a few degrees, which is
 * enough to feel present without letting anyone walk through the walls.
 *
 * With reduced motion the intro is skipped entirely and every move is a cut.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { INTRO, type Viewpoint } from "./viewpoints";

interface CameraRigProps {
  viewpoint: Viewpoint;
  /** Play the one-time entry move. */
  intro: boolean;
  reducedMotion: boolean;
  onIntroDone?: () => void;
  /** 0–1 how much the visitor may look around. */
  lookAmount?: number;
}

export function CameraRig({
  viewpoint,
  intro,
  reducedMotion,
  onIntroDone,
  lookAmount = 1,
}: CameraRigProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  /** The animated values. GSAP writes here; useFrame reads. */
  const rig = useRef({
    x: INTRO.from.position[0],
    y: INTRO.from.position[1],
    z: INTRO.from.position[2],
    tx: INTRO.to.target[0],
    ty: INTRO.to.target[1],
    tz: INTRO.to.target[2],
    fov: INTRO.from.fov,
  });

  const look = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const introPlayed = useRef(false);
  /** True while the entry move owns the camera, so nothing else tweens it. */
  const introRunning = useRef(intro);
  const tween = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  /** Reused every frame — allocating a vector 60 times a second is pure waste. */
  const lookTarget = useRef(new THREE.Vector3());

  /* the visitor's small look-around, from pointer or device tilt */
  useEffect(() => {
    if (reducedMotion) return;
    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [reducedMotion]);

  /* the entry move, once */
  useEffect(() => {
    if (!intro || introPlayed.current) return;
    introPlayed.current = true;

    if (reducedMotion) {
      Object.assign(rig.current, {
        x: INTRO.to.position[0], y: INTRO.to.position[1], z: INTRO.to.position[2],
        tx: INTRO.to.target[0], ty: INTRO.to.target[1], tz: INTRO.to.target[2],
        fov: INTRO.to.fov,
      });
      introRunning.current = false;
      onIntroDone?.();
      return;
    }

    tween.current = gsap.to(rig.current, {
      x: INTRO.to.position[0],
      y: INTRO.to.position[1],
      z: INTRO.to.position[2],
      fov: INTRO.to.fov,
      duration: INTRO.duration,
      ease: "power2.inOut",
      onComplete: () => {
        introRunning.current = false;
        onIntroDone?.();
      },
    });

    return () => {
      tween.current?.kill();
    };
  }, [intro, reducedMotion, onIntroDone]);

  /* moving between viewpoints */
  useEffect(() => {
    // The entry move owns the camera until it finishes; without this the
    // viewpoint tween would start on mount and cut the intro short.
    if (introRunning.current) return;

    const [x, y, z] = viewpoint.position;
    const [tx, ty, tz] = viewpoint.target;

    if (reducedMotion) {
      Object.assign(rig.current, { x, y, z, tx, ty, tz, fov: viewpoint.fov });
      return;
    }

    tween.current?.kill();
    tween.current = gsap.to(rig.current, {
      x, y, z, tx, ty, tz,
      fov: viewpoint.fov,
      duration: 1.75,
      ease: "power3.inOut",
    });

    return () => {
      tween.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewpoint.id, reducedMotion]);

  /* apply, every frame */
  useFrame((_, delta) => {
    const r = rig.current;
    const k = Math.min(1, delta * 4);

    // ease the look-around toward the pointer
    look.current.x += (pointer.current.x * 0.22 * lookAmount - look.current.x) * k;
    look.current.y += (pointer.current.y * 0.12 * lookAmount - look.current.y) * k;

    camera.position.set(r.x, r.y, r.z);

    // A gentle hand-held drift. Amplitude is a couple of centimetres: enough to
    // stop the held shot feeling like a screenshot, small enough not to be seen
    // as movement.
    const t = performance.now() / 1000;
    camera.position.x += Math.sin(t * 0.31) * 0.012;
    camera.position.y += Math.sin(t * 0.47 + 1.2) * 0.008;

    lookTarget.current.set(
      r.tx + look.current.x * 1.6,
      r.ty - look.current.y * 0.9,
      r.tz,
    );
    camera.lookAt(lookTarget.current);

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
