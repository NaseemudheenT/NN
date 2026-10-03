"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import * as THREE from "three";

/**
 * The grade.
 *
 * Three effects, each doing a job a camera does and none of them doing it
 * for decoration.
 *
 * ── BLOOM ────────────────────────────────────────────────────────────
 * A real lens scatters bright light inside itself. The threshold is set
 * HIGH (0.9) on purpose: bloom below the clipping point turns an entire
 * image into fog, and the single most common way a WebGL scene announces
 * itself as a WebGL scene is a soft glow over everything. Here only two
 * things in the building pass the threshold — the windows, which are
 * genuinely blown out, and the filaments of the sconces — so the glow lands
 * exactly where a photograph of this room would have it.
 *
 * ── DEPTH OF FIELD ───────────────────────────────────────────────────
 * Focus is set in WORLD METRES, not in the 0–1 normalised units the effect
 * also accepts, and it is pulled toward whatever the walker is actually
 * looking at. Normalised focus is a fraction of the camera's near-to-far
 * range, so it drifts every time anything about the frustum changes and the
 * subject slides out of focus for no reason the viewer can see.
 *
 * The aperture is small. A shallow depth of field on an interior is a
 * mistake people make because it looks "cinematic" in a still — in motion
 * it means the room you are trying to walk through is a blur, and the one
 * job of a showroom is that you can see the stock.
 *
 * ── VIGNETTE ─────────────────────────────────────────────────────────
 * Slight. It does what a lens does at the edges and, more usefully, it
 * holds the eye on the centre of the nave.
 */
export function Cinema({ enabled }: { enabled: boolean }) {
  const { camera, scene } = useThree();
  const focus = useRef(14);
  const ray = useRef(new THREE.Raycaster());
  const forward = useRef(new THREE.Vector3());
  const every = useRef(0);

  useFrame((_, dt) => {
    if (!enabled) return;

    /* Re-focus six times a second, not sixty. A raycast through a scene
       this size is the single most expensive thing on the frame, and the
       eye cannot tell the difference — focus in a real camera is slow. */
    every.current += dt;
    if (every.current < 0.16) return;
    every.current = 0;

    camera.getWorldDirection(forward.current);
    ray.current.set(camera.position, forward.current);
    ray.current.far = 60;
    const hit = ray.current.intersectObjects(scene.children, true)[0];
    const target = hit ? THREE.MathUtils.clamp(hit.distance, 1.2, 46) : 24;

    /* Rack toward it rather than snapping. A focus pull is a movement. */
    focus.current += (target - focus.current) * 0.22;
  });

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField
        worldFocusDistance={focus.current}
        worldFocusRange={14}
        bokehScale={2.4}
        resolutionScale={0.5}
      />
      <Bloom
        mipmapBlur
        luminanceThreshold={0.9}
        luminanceSmoothing={0.12}
        intensity={0.85}
        radius={0.72}
        kernelSize={KernelSize.LARGE}
      />
      <Vignette offset={0.26} darkness={0.56} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
