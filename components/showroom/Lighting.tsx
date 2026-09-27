"use client";

/**
 * The lights.
 *
 * One sun with a shadow map, one hemisphere for the sky's bounce, a low fill so
 * nothing goes fully black, and the interior lamps. The sun's direction, colour
 * and strength all come from lib/daytime.ts, so the room at nine in the morning
 * in December is genuinely a different room from nine in June.
 *
 * Changes blend over sixty seconds, as specified. The blend is done on the
 * live light objects rather than in React state, so a phase change costs no
 * re-renders — it is sixty seconds of lerping three colours and five numbers.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
import type { SkyState } from "@/lib/daytime";
import { BLEND_MS, rigFromSky, type LightingRig } from "./lightingRig";
import { HDRI, HDRI_FALLBACK_PRESET, hasHdri, loadManifest } from "./assets";
import { ROOM } from "./objects/Room";

interface LightingProps {
  sky: SkyState;
  /** Fewer shadow samples and no environment on weak devices. */
  quality: "low" | "medium" | "high";
  onRig?: (rig: LightingRig) => void;
}

export function Lighting({ sky, quality, onRig }: LightingProps) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.AmbientLight>(null);
  const fog = useRef<THREE.Fog>(null);

  const target = useMemo(() => rigFromSky(sky), [sky]);

  /** Where we are blending from, and when the blend started. */
  const from = useRef<LightingRig>(target);
  const startedAt = useRef<number>(0);
  const current = useRef<LightingRig>(target);

  // Colour objects reused across frames.
  const colours = useRef({
    sun: new THREE.Color(target.sunColour),
    sunTo: new THREE.Color(target.sunColour),
    sky: new THREE.Color(target.ambientColour),
    skyTo: new THREE.Color(target.ambientColour),
    fog: new THREE.Color(target.fog.colour),
    fogTo: new THREE.Color(target.fog.colour),
  });

  useEffect(() => {
    from.current = { ...current.current };
    colours.current.sunTo.set(target.sunColour);
    colours.current.skyTo.set(target.ambientColour);
    colours.current.fogTo.set(target.fog.colour);
    startedAt.current = performance.now();
    onRig?.(target);
  }, [target, onRig]);

  useFrame(() => {
    const elapsed = performance.now() - startedAt.current;
    // Smoothstep, so the change eases in and out rather than starting abruptly.
    const raw = Math.min(1, elapsed / BLEND_MS);
    const t = raw * raw * (3 - 2 * raw);

    const lerp = (a: number, b: number) => a + (b - a) * t;
    const a = from.current;

    const rig: LightingRig = {
      ...target,
      sunPosition: [
        lerp(a.sunPosition[0], target.sunPosition[0]),
        lerp(a.sunPosition[1], target.sunPosition[1]),
        lerp(a.sunPosition[2], target.sunPosition[2]),
      ],
      sunIntensity: lerp(a.sunIntensity, target.sunIntensity),
      ambientIntensity: lerp(a.ambientIntensity, target.ambientIntensity),
      windowIntensity: lerp(a.windowIntensity, target.windowIntensity),
      lampIntensity: lerp(a.lampIntensity, target.lampIntensity),
      signIntensity: lerp(a.signIntensity, target.signIntensity),
      exposure: lerp(a.exposure, target.exposure),
      shadowRadius: lerp(a.shadowRadius, target.shadowRadius),
    };
    current.current = rig;

    if (sun.current) {
      sun.current.position.set(...rig.sunPosition);
      sun.current.intensity = rig.sunIntensity;
      colours.current.sun.lerp(colours.current.sunTo, Math.min(1, t * 1.4));
      sun.current.color.copy(colours.current.sun);
      if (sun.current.shadow) sun.current.shadow.radius = rig.shadowRadius;
    }
    if (hemi.current) {
      hemi.current.intensity = rig.ambientIntensity;
      hemi.current.color.lerp(colours.current.skyTo, Math.min(1, t * 1.4));
    }
    if (fill.current) {
      fill.current.intensity = rig.ambientIntensity * 0.4;
    }
    if (fog.current) {
      fog.current.color.lerp(colours.current.fogTo, Math.min(1, t * 1.4));
      fog.current.near = rig.fog.near;
      fog.current.far = rig.fog.far;
    }
  });

  const shadowSize = quality === "high" ? 2048 : quality === "medium" ? 1024 : 512;

  // Use a photographed .hdr only when one has actually been supplied. Asking
  // drei for a file that is not there throws inside Suspense and takes the
  // whole room down, so presence is checked against the manifest first.
  const [manifestReady, setManifestReady] = useState(false);
  useEffect(() => {
    void loadManifest().then(() => setManifestReady(true));
  }, []);
  const hdriFile = manifestReady && hasHdri(HDRI[sky.phase]) ? HDRI[sky.phase] : undefined;

  return (
    <>
      <fog ref={fog} attach="fog" args={[target.fog.colour, target.fog.near, target.fog.far]} />

      {/* the sun. One shadow-casting light: more would cost more than it adds. */}
      <directionalLight
        ref={sun}
        position={target.sunPosition}
        intensity={target.sunIntensity}
        color={target.sunColour}
        castShadow={quality !== "low"}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-ROOM.width * 0.7}
        shadow-camera-right={ROOM.width * 0.7}
        shadow-camera-top={ROOM.height * 1.6}
        shadow-camera-bottom={-2}
      />

      {/* sky above, floor bounce below */}
      <hemisphereLight
        ref={hemi}
        args={[target.ambientColour, "#8a7b6a", target.ambientIntensity]}
      />

      {/* a low fill so a dark corner is dark, not empty */}
      <ambientLight ref={fill} intensity={target.ambientIntensity * 0.4} color={target.ambientColour} />

      {/* Photographed light when an .hdr has been supplied, a built-in preset
          otherwise. The room is lit correctly either way; the HDRI is what
          makes the brass and the mirror look like brass and a mirror. */}
      {quality === "low" ? null : (
        <Environment
          key={`${sky.phase}-${hdriFile ?? "preset"}`}
          {...(hdriFile
            ? { files: hdriFile }
            : { preset: HDRI_FALLBACK_PRESET[sky.phase] })}
          background={false}
          environmentIntensity={0.35 + 0.55 * sky.beam}
        />
      )}
    </>
  );
}

export { HDRI_FALLBACK_PRESET };
