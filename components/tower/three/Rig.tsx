"use client";

import * as THREE from "three";
import { Environment, Lightformer, SoftShadows } from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode, BlendFunction } from "postprocessing";
import { SUN } from "./Sky";

/**
 * NN TOWER — the lighting rig and the camera's film stock.
 *
 * This file is why the building does not look like a game. The geometry in
 * the rest of the folder is ordinary; what separates a render from a game
 * frame is entirely here.
 *
 * ── the environment is a photo studio, not a preset ──────────────────
 * drei's `<Environment preset="city" />` fetches an HDRI from a CDN: a
 * network dependency, a two-megabyte download, and someone else's city
 * reflected in our glass. Instead the environment is BUILT — flat emissive
 * panels arranged around the model exactly the way a product photographer
 * arranges softboxes. A large soft key high on one side, a cooler fill
 * opposite, a long low warm strip for the dusk horizon, and narrow bright
 * bars that metal and glass can catch as specular streaks.
 *
 * That last point is the whole trick. A polished brass handle is only
 * convincing because it reflects something with *shape*. Lit by point
 * lights alone it is a grey cylinder with a white dot on it, which is
 * exactly what every one of the earlier attempts looked like.
 *
 * ── the film stock ───────────────────────────────────────────────────
 * ACES Filmic is the tone curve used in cinema. Linear output clips bright
 * windows to flat white and crushes shadows to flat black — the signature
 * of an untreated game buffer. ACES rolls both ends off, so a 5000 K
 * fitting-room light and a 2500 K rooftop lantern can sit in one frame and
 * both keep their colour.
 */

export function Rig({ quality = "high" }: { quality?: "high" | "medium" | "low" }) {
  const high = quality === "high";
  const med = quality !== "low";

  return (
    <>
      {/* A faint ambient floor so nothing is ever pure black. Real rooms
          have bounce; absolute darkness only happens in a vacuum. */}
      <ambientLight intensity={0.19} color="#fff4e6" />

      {/* The sun. Low and warm, because the building is best at dusk and a
          low sun is what carves a classical facade — a noon sun flattens a
          cornice into a stripe. */}
      <directionalLight
        castShadow
        /* The same vector the sky shader puts the sun at. If the
           sky shows a low western sun and the shadows fall as though it
           were overhead, the eye catches it immediately. */
        position={[SUN.x, SUN.y, SUN.z]}
        intensity={1.85}
        color="#ffd9a8"
        shadow-mapSize={high ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.028}
      >
        <orthographicCamera attach="shadow-camera" args={[-46, 46, 56, -16, 0.5, 140]} />
      </directionalLight>

      {/* Sky fill from straight above, cool, weak — the blue half of dusk. */}
      <hemisphereLight args={["#9fc0e8", "#17120e", 0.42]} />

      {med && <SoftShadows size={28} samples={high ? 16 : 8} focus={0.6} />}

      {/* ── the studio ──────────────────────────────────────────────── */}
      <Environment resolution={high ? 512 : 256} frames={1} background={false}>
        {/* dusk sky dome: cool above, warm at the horizon */}
        <Lightformer form="rect" intensity={0.52} color="#7f9fd4"
          position={[0, 60, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[120, 120, 1]} />
        <Lightformer form="rect" intensity={0.78} color="#ffb27a"
          position={[0, 6, -70]} rotation={[0, 0, 0]} scale={[150, 26, 1]} />
        <Lightformer form="rect" intensity={0.52} color="#ff9c63"
          position={[0, 4, 70]} rotation={[0, Math.PI, 0]} scale={[150, 20, 1]} />

        {/* Key and fill, and the fill matters more here than in a still.
            The tower turns continuously on the gate screen, so every face
            becomes the camera-facing one in turn. A classic 4:1 key-to-fill
            ratio — correct for a fixed hero shot — left the building a
            black silhouette for a third of every revolution. Roughly 3:2
            keeps the shadow side readable without flattening the stone. */}
        {/* key: big, soft, high, camera-left */}
        <Lightformer form="rect" intensity={2.15} color="#fff0dd"
          position={[-46, 42, 30]} rotation={[0, -Math.PI / 3.1, 0]} scale={[46, 44, 1]} />

        {/* fill: cooler, opposite, half the strength */}
        <Lightformer form="rect" intensity={1.55} color="#bfd4f2"
          position={[48, 26, -20]} rotation={[0, Math.PI / 2.4, 0]} scale={[40, 34, 1]} />

        {/* the specular bars — narrow, bright, and the reason brass reads as
            brass. Each one becomes a moving highlight on every curved metal
            surface as the camera travels. */}
        <Lightformer form="rect" intensity={3.0} color="#ffffff"
          position={[-16, 50, 16]} rotation={[Math.PI / 2, 0, 0]} scale={[2.2, 58, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffe9c9"
          position={[14, 50, -12]} rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={[1.8, 58, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#ffd9a8"
          position={[26, 18, 30]} scale={[9, 9, 1]} />

        {/* ground bounce: the pavement throwing warm light back up into the
            soffits and the underside of the cornice */}
        <Lightformer form="rect" intensity={0.22} color="#4a3f33"
          position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[90, 90, 1]} />
      </Environment>

      {/* ── the film ────────────────────────────────────────────────── */}
      <EffectComposer multisampling={0} enableNormalPass>
        {/* Contact darkening. This is what stops every object looking like a
            sticker: corners, reveals, the gap under a cornice and the seam
            where a mullion meets stone all go properly dark. */}
        <N8AO
          aoRadius={2.4}
          intensity={high ? 2.6 : 1.8}
          distanceFalloff={0.9}
          quality={high ? "high" : "low"}
          color="#120d08"
          halfRes={!high}
        />
        {/* Lit windows and the dome bloom because real lenses do. The
            threshold sits just above white so only genuinely emissive
            surfaces glow — raise the whole image and it turns to fog. */}
        {/* The threshold sits almost at white on purpose. At 0.88 it was
            catching the lit facade itself and turning the building into a
            lantern; only the dome lamp and the hottest window edges should
            ever bloom. Bloom is a lens artefact, not a light source. */}
        <Bloom
          intensity={0.34}
          luminanceThreshold={0.96}
          luminanceSmoothing={0.12}
          mipmapBlur
          radius={0.66}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        {/* A touch of warmth and contrast, the way a colourist finishes a
            dusk exterior. Small numbers: this is a grade, not a filter. */}
        <HueSaturation saturation={0.06} hue={0} />
        <BrightnessContrast brightness={-0.015} contrast={0.11} />
        <Vignette offset={0.28} darkness={0.62} blendFunction={BlendFunction.NORMAL} />
        {med ? <SMAA /> : <></>}
      </EffectComposer>
    </>
  );
}

/** Renderer settings that belong to the Canvas, not to the scene. */
export const GL_SETTINGS = {
  antialias: false, // SMAA in the composer does this better and cheaper
  alpha: false,
  powerPreference: "high-performance" as const,
  toneMapping: THREE.NoToneMapping, // the composer owns tone mapping
  outputColorSpace: THREE.SRGBColorSpace,
};
