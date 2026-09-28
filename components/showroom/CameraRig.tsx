"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { VIEWPOINTS } from "@/lib/tokens";

const pos = new THREE.Vector3();
const tgt = new THREE.Vector3();
const wantPos = new THREE.Vector3();
const wantTgt = new THREE.Vector3();
const aPos = new THREE.Vector3();
const bPos = new THREE.Vector3();
const aTgt = new THREE.Vector3();
const bTgt = new THREE.Vector3();

function smoothstep(t: number) {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * (3 - 2 * x);
}

/**
 * One camera controller for the whole site.
 *
 * On the home page scroll walks the camera along a fixed route through the
 * showroom. Elsewhere it settles on a named viewpoint. Movement is always
 * critically damped — it accelerates and decelerates, and never snaps.
 */
export function CameraRig({
  mode,
  viewpointId,
  scrollRef,
  reducedMotion,
  pointerParallax = true,
  intro = false,
}: {
  mode: "scroll" | "viewpoint";
  viewpointId?: string;
  scrollRef?: React.RefObject<number>;
  reducedMotion: boolean;
  pointerParallax?: boolean;
  intro?: boolean;
}) {
  const { camera, size } = useThree();
  const started = useRef(false);
  const introT = useRef(0);

  useFrame((state, delta) => {
    if (!started.current) {
      started.current = true;
      // The entrance: further out and lower, so the first move is a step inside.
      const start = intro && !reducedMotion ? [0, 1.45, 14.5] : VIEWPOINTS[0].position;
      camera.position.set(start[0], start[1], start[2]);
      pos.copy(camera.position);
      tgt.set(0, 1.5, 0);
    }

    const dt = Math.min(delta, 0.05);
    introT.current = Math.min(introT.current + dt, 6);

    if (mode === "scroll" && scrollRef) {
      const p = Math.min(Math.max(scrollRef.current ?? 0, 0), 1);
      const seg = p * (VIEWPOINTS.length - 1);
      const i = Math.min(Math.floor(seg), VIEWPOINTS.length - 2);
      const f = smoothstep(seg - i);
      const a = VIEWPOINTS[i];
      const b = VIEWPOINTS[i + 1];
      aPos.set(...a.position);
      bPos.set(...b.position);
      aTgt.set(...a.target);
      bTgt.set(...b.target);
      wantPos.copy(aPos).lerp(bPos, f);
      wantTgt.copy(aTgt).lerp(bTgt, f);
    } else {
      const v = VIEWPOINTS.find((x) => x.id === viewpointId) ?? VIEWPOINTS[1];
      wantPos.set(...v.position);
      wantTgt.set(...v.target);
    }

    // Pointer parallax: a head turn, not a camera swing.
    if (pointerParallax && !reducedMotion && size.width > 768) {
      wantPos.x += state.pointer.x * 0.26;
      wantPos.y += state.pointer.y * 0.14;
      wantTgt.x += state.pointer.x * 0.5;
      wantTgt.y += state.pointer.y * 0.22;
    }

    // Slower settle during the entrance, then responsive.
    const lambda = reducedMotion ? 30 : introT.current < 3.2 ? 0.85 : 2.6;
    const k = 1 - Math.exp(-lambda * dt);

    pos.lerp(wantPos, k);
    tgt.lerp(wantTgt, k);
    camera.position.copy(pos);
    camera.lookAt(tgt);
  });

  return null;
}
