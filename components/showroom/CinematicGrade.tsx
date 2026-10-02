"use client";

/**
 * The cinematic grade — the pass that decides whether this reads as a
 * photograph of a showroom or as a game level.
 *
 * Everything before this file is geometry and light: thick masonry, Romanesque
 * arches, 17° beams, 2700 K coves. All of it correct, and none of it enough,
 * because a camera does things to a scene that a renderer does not do for free.
 * Compare the Founder's reference photograph to a raw render and the geometry
 * is not what separates them. Four things are.
 *
 *  1. DEPTH OF FIELD. The single biggest one. A real lens has ONE plane in
 *     focus and everything in front of and behind it falls away. A raw render
 *     is sharp everywhere, and sharp-everywhere is the universal signature of
 *     computer graphics — the eye reads infinite focus as "rendered" before it
 *     consciously registers anything else. The reference has the garments
 *     crisp and the window soft, and that gradient alone does more for realism
 *     than any amount of extra polygons.
 *
 *  2. GRAIN. Every photograph has noise. A perfectly clean image reads as
 *     synthetic, and a very small amount of grain — 2–4% — also hides the
 *     banding that gradients across a dark room always produce in 8-bit.
 *
 *  3. AMBIENT OCCLUSION. Contact shadow in the corners where surfaces meet.
 *     Direct lighting cannot produce it; without it, objects look like they
 *     are hovering a millimetre off the floor. This is what sits a garment
 *     rail against a wall rather than in front of it.
 *
 *  4. A GRADE. Film is not neutral. A warm interior photographed well has its
 *     shadows pulled slightly cool and its highlights slightly warm, and its
 *     saturation lifted a touch past what the sensor recorded.
 *
 * ── the cost, and who pays it ─────────────────────────────────────────
 * Depth of field and ambient occlusion are the two most expensive passes in
 * the stack — DOF samples the frame repeatedly at every pixel, SSAO samples
 * the depth buffer. Neither runs below the high tier. A mid device keeps the
 * grain and the grade, which are nearly free and carry a surprising amount of
 * the effect on their own; a low device gets neither and still gets a room.
 */

import {
  Bloom,
  BrightnessContrast,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  Noise,
  SMAA,
  SSAO,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { DepthOfFieldEffect } from "postprocessing";
import type { DayPhase } from "@/lib/daytime";
import { rackFocus } from "./focus";

export type Quality = "low" | "medium" | "high";

interface CinematicGradeProps {
  quality: Quality;
  phase: DayPhase;
  /** Bloom, from the lighting rig — tuned per phase so cloth never glows. */
  bloom: { threshold: number; intensity: number };
  reducedMotion: boolean;
}

export function CinematicGrade({
  quality,
  phase,
  bloom,
  reducedMotion,
}: CinematicGradeProps) {
  const night = phase === "night";
  const high = quality === "high";
  const mid = quality !== "low";

  /* The focus pull. The rigs write the distance to the subject into
     ./focus every frame; this eases toward it and writes the result
     straight onto the effect, bypassing React entirely — a setState per
     frame would re-render the canvas sixty times a second to move one
     number. */
  const dof = useRef<DepthOfFieldEffect>(null);
  useFrame((_, delta) => {
    if (!dof.current) return;
    const metres = rackFocus(delta);
    // Setting the uniform directly: the effect exposes the world distance
    // as a circle-of-confusion material uniform rather than a React prop.
    const material = dof.current.cocMaterial;
    material.worldFocusDistance = metres;
    /* How deep the sharp band is, in metres. Scaled with distance because a
       lens behaves that way — depth of field grows as the subject recedes,
       so a fixed range would blur a distant wall into mush and leave a close
       garment with no falloff at all. */
    material.worldFocusRange = Math.min(9, 1.6 + metres * 0.42);
  });

  return (
    <EffectComposer enableNormalPass={high}>
      {/* ── contact shadow ──────────────────────────────────────────
          Where a rail meets a wall and a plinth meets the floor. Without
          it every object hovers. Needs the normal pass, so it is gated
          with it. */}
      {high ? (
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={16}
          radius={0.08}
          intensity={22}
          luminanceInfluence={0.5}
          /* Bias keeps a surface from occluding itself and stippling the
             whole frame, which is the classic SSAO failure. */
          bias={0.035}
          worldDistanceThreshold={0.6}
          worldDistanceFalloff={0.2}
          worldProximityThreshold={0.4}
          worldProximityFalloff={0.1}
          distanceScaling
          depthAwareUpsampling
        />
      ) : (
        <></>
      )}

      {/* ── the lens ────────────────────────────────────────────────
          focalLength is the aperture here, not the focal length its name
          suggests: lower numbers blur harder. 0.015 is roughly an f/2
          look — enough that the far wall softens and the garment in the
          niche does not. bokehScale rounds the highlights, which is what
          turns a blur into a lens.

          Focus distance and range are NOT passed as props. The constructor
          options of those names are deprecated in postprocessing 6, and
          they would only set an initial value anyway — the real ones are
          written onto the circle-of-confusion material every frame above. */}
      {high ? (
        <DepthOfField
          ref={dof}
          focalLength={0.015}
          bokehScale={2.6}
          height={480}
        />
      ) : (
        <></>
      )}

      {/* ── the lamps ───────────────────────────────────────────────
          Threshold comes from the rig and rises in daylight, so bloom
          lands on the emitters and never on a white shirt. */}
      <Bloom
        intensity={bloom.intensity}
        luminanceThreshold={bloom.threshold}
        luminanceSmoothing={0.3}
        mipmapBlur
      />

      {/* ── the grade ───────────────────────────────────────────────
          Film is not neutral. A touch of saturation, and the contrast
          opened at night so the dark half of the room keeps its
          separation instead of crushing to flat black. */}
      {mid ? (
        <HueSaturation hue={0} saturation={night ? 0.1 : 0.05} />
      ) : (
        <></>
      )}
      {mid ? (
        <BrightnessContrast
          brightness={night ? -0.015 : 0}
          contrast={night ? 0.075 : 0.045}
        />
      ) : (
        <></>
      )}

      <Vignette offset={0.32} darkness={night ? 0.55 : 0.3} />

      {/* ── grain ───────────────────────────────────────────────────
          3%. Barely visible as texture, and it does two jobs: a clean
          image reads as synthetic, and gradients across a dark room band
          in 8-bit without noise to dither them.

          It is skipped under reduced motion. Grain that regenerates every
          frame is a full-screen shimmer, which is exactly the kind of
          movement somebody asking for less of it does not want. */}
      {mid && !reducedMotion ? (
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.3} />
      ) : (
        <></>
      )}

      {high ? <SMAA /> : <></>}
    </EffectComposer>
  );
}
