"use client";

/**
 * The camera, driven by the scroll.
 *
 * The homepage is a walk through the showroom, so the scrollbar is not a
 * scrollbar — it is the customer's position in the room. Scroll progress
 * interpolates along a path of stations, each with a place to stand, a thing
 * to look at, and a focal length.
 *
 * Four things make this feel like a camera rather than a slider:
 *
 *  · SMOOTHING. Raw scroll is jittery and arrives in discrete jumps. The
 *    progress is run through a spring, so the camera has inertia: it starts
 *    after you do and settles after you stop, the way a body carrying a
 *    camera does.
 *  · A ROUTED PATH, not a spline through the stations. A spline takes the
 *    shortest pretty line between waypoints, and the shortest line from the
 *    rails to the table goes through a dressed mannequin. Each leg is routed
 *    around the furniture by components/showroom/choreography, so the stations
 *    stay what they should be — where you stand and what you look at — and
 *    the room decides the path between them.
 *  · DISTANCE, not waypoint count, drives the scroll. Because the legs are
 *    routed they are no longer equal lengths, so progress is mapped through
 *    arc length. Scrolling at a steady rate therefore walks at a steady pace
 *    instead of sprinting across the long legs.
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
import { exposeCamera } from "./devCamera";
import { routeBetween } from "./choreography";

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

  /* The walk. Built once: it is geometry, not state.

     Every leg is routed around the furniture, then the legs are joined into
     one curve. `breaks` records where each station falls along that curve as
     a fraction of total distance, which is what keeps the focal length and
     the look direction synchronised with the stations now that the legs are
     no longer the same length. */
  const { path, look, fovs, breaks } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const lengths: number[] = [];

    for (let i = 0; i < stations.length - 1; i += 1) {
      const leg = routeBetween(stations[i].position, stations[i + 1].position);
      // Drop the duplicated join so the curve has no zero-length segment,
      // which would otherwise put a NaN in the arc-length table.
      points.push(...(i === 0 ? leg : leg.slice(1)));
      lengths.push(
        new THREE.CatmullRomCurve3(leg, false, "catmullrom", 0.5).getLength(),
      );
    }

    const total = lengths.reduce((a, b) => a + b, 0);
    const marks: number[] = [0];
    let run = 0;
    for (const l of lengths) {
      run += l;
      marks.push(run / total);
    }

    return {
      path: new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5),
      look: new THREE.CatmullRomCurve3(
        stations.map((s) => new THREE.Vector3(...s.target)),
        false,
        "catmullrom",
        0.4,
      ),
      fovs: stations.map((s) => s.fov),
      breaks: marks,
    };
  }, [stations]);

  /* A handle on the camera for in-browser verification. Development only. */
  useEffect(() => exposeCamera(camera, "scroll"), [camera]);

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

    /* Which leg the walk is on, by distance travelled rather than by
       waypoint count — the legs are routed, so they are not equal lengths. */
    let index = 0;
    while (index < breaks.length - 2 && t >= breaks[index + 1]) index += 1;
    const span = breaks[index + 1] - breaks[index];
    const within = span > 1e-6 ? (t - breaks[index]) / span : 0;

    /* The eyes, and the focal length, keyed to the stations on either side. */
    look.getPointAt(
      THREE.MathUtils.clamp((index + within) / (stations.length - 1), 0, 1),
      target,
    );
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
    // On the floor, the room open on both sides. Stood well clear of the
    // dressed form at (-2.1, 1.5) — the previous standpoint was 0.33 m off
    // its shoulder, close enough to crowd the frame.
    position: [-3.4, 1.6, 0.45],
    target: [1.2, 1.3, 1.2],
    fov: 50,
  },
  {
    id: "rails",
    // Square on to the first rail, two metres back, the way you stand to
    // read a row of shirts. This station used to sit at (-2.0, 1.5), which
    // is 0.1 m from the centre of a dressed mannequin — the camera was
    // standing inside it, and the shirt on the form filled the lens.
    position: [-3.3, 1.55, 1.6],
    target: [-3.3, 1.5, 3.85],
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
