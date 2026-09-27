"use client";

/**
 * The camera, driven by the scroll.
 *
 * The homepage is a walk through the showroom, so the scrollbar is not a
 * scrollbar — it is the customer's position in the room. Scroll progress
 * interpolates along a path of stations, each with a place to stand, a thing
 * to look at, and a focal length.
 *
 * Three things make this feel like a camera rather than a slider:
 *
 *  · SMOOTHING. Raw scroll is jittery and arrives in discrete jumps. The
 *    progress is run through a spring, so the camera has inertia: it starts
 *    after you do and settles after you stop, the way a body carrying a
 *    camera does.
 *  · CATMULL-ROM, not linear. Interpolating straight between stations gives
 *    a visible corner at each one. A spline through them curves, so the walk
 *    is continuous and nobody notices the waypoints.
 *  · A SHORTER LENS AS IT CLOSES IN. The focal length tightens toward a
 *    garment and widens in the open room, which is what a person does with
 *    their attention and what a film does with a lens.
 *
 * Reduced motion parks the camera at the first station and stops. The page
 * still scrolls and every word of content is still reachable — only the walk
 * is gone.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useSpring, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export interface Station {
  id: string;
  /** Where the customer stands, in metres. */
  position: [number, number, number];
  /** What they are looking at. */
  target: [number, number, number];
  /** Focal length in degrees. Tighter as attention narrows. */
  fov: number;
}

interface ScrollCameraProps {
  stations: Station[];
  /** 0 at the top of the walk, 1 at the end. */
  progress: MotionValue<number>;
  reducedMotion: boolean;
  /** How much the visitor may look around, 0–1. */
  lookAmount?: number;
}

export function ScrollCamera({ stations, progress, reducedMotion, lookAmount = 1 }: ScrollCameraProps) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);

  /* The scroll, smoothed. Stiff enough to keep up, damped enough to have
     weight — a camera that tracked the scrollbar exactly would feel like a
     slider, because that is what it would be. */
  const smooth = useSpring(progress, { stiffness: 78, damping: 26, mass: 0.9 });

  /* Splines through the stations. Built once: they are geometry, not state. */
  const { path, look, fovs } = useMemo(() => {
    const points = stations.map((s) => new THREE.Vector3(...s.position));
    const targets = stations.map((s) => new THREE.Vector3(...s.target));
    return {
      path: new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4),
      look: new THREE.CatmullRomCurve3(targets, false, "catmullrom", 0.4),
      fovs: stations.map((s) => s.fov),
    };
  }, [stations]);

  /* The visitor's small look-around, on top of wherever the walk has them. */
  const pointer = useRef({ x: 0, y: 0 });
  const drift = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  /* Reused every frame. Allocating vectors sixty times a second is the
     cheapest way to make a 3D scene stutter. */
  const scratch = useRef({
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });

  useFrame((_, delta) => {
    const t = reducedMotion ? 0 : Math.min(1, Math.max(0, smooth.get()));
    const { position, target } = scratch.current;

    path.getPointAt(t, position);
    look.getPointAt(t, target);

    /* the focal length, interpolated between the two nearest stations */
    const span = (stations.length - 1) * t;
    const index = Math.min(stations.length - 2, Math.floor(span));
    const within = span - index;
    const fov = fovs[index] + (fovs[index + 1] - fovs[index]) * within;

    /* the look-around, eased */
    const k = Math.min(1, delta * 4);
    drift.current.x += (pointer.current.x * 0.2 * lookAmount - drift.current.x) * k;
    drift.current.y += (pointer.current.y * 0.11 * lookAmount - drift.current.y) * k;

    camera.position.copy(position);

    if (!reducedMotion) {
      /* A hand-held drift of a couple of centimetres. Enough that a held
         shot is not a screenshot, small enough to read as breathing
         rather than as movement. */
      const now = performance.now() / 1000;
      camera.position.x += Math.sin(now * 0.29) * 0.013;
      camera.position.y += Math.sin(now * 0.44 + 1.1) * 0.009;
    }

    target.x += drift.current.x * 1.5;
    target.y -= drift.current.y * 0.85;
    camera.lookAt(target);

    /* A narrow phone sees less of the room at the same focal length, so the
       lens widens to compensate. Without this the showroom is a corridor. */
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.95 ? (0.95 - aspect) * 30 : 0;
    const next = fov + portrait;
    if (Math.abs(camera.fov - next) > 0.02) {
      camera.fov = next;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * The walk through the showroom.
 *
 * Six stations, from outside the door to the fitting room. The path they
 * describe is the journey the brief asks for: entry, then the room, then the
 * garments, then the fit.
 */
export const HOME_WALK: Station[] = [
  {
    id: "approach",
    // Outside, looking in. The customer has not arrived yet.
    position: [-8.4, 1.78, 0.4],
    target: [0.6, 1.4, 0.1],
    fov: 58,
  },
  {
    id: "entrance",
    // Through the door, standing on the threshold over the inlaid monogram.
    position: [-5.0, 1.66, 0.2],
    target: [0.8, 1.3, 0.1],
    fov: 54,
  },
  {
    id: "floor",
    // On the floor, the room open on both sides.
    position: [-2.4, 1.6, 0.9],
    target: [1.4, 1.35, 1.6],
    fov: 50,
  },
  {
    id: "rails",
    // At the rails, turned toward the shirts.
    position: [-2.0, 1.55, 1.5],
    target: [-2.6, 1.5, 3.9],
    fov: 42,
  },
  {
    id: "table",
    // Over the table, looking down at the folded trousers.
    position: [-0.5, 1.46, 0.5],
    target: [-0.4, 0.55, -0.9],
    fov: 40,
  },
  {
    id: "mirror",
    // At the mirror, with the dressed forms behind.
    position: [3.6, 1.62, -1.1],
    target: [5.8, 1.22, -1.4],
    fov: 48,
  },
];
