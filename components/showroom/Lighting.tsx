"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { LIGHTING, type DayPhase } from "@/lib/tokens";
import type { Quality } from "@/components/layout/ShowroomProvider";
import { ROOM } from "./assets";

/**
 * Architectural lighting. The same room at four hours of the day.
 * Presets blend continuously — the visitor never sees a theme switch,
 * only the light changing the way light changes.
 */
export function Lighting({
  phase,
  quality,
  focusColor,
}: {
  phase: DayPhase;
  quality: Quality;
  focusColor: THREE.Color | null;
}) {
  const target = LIGHTING[phase];

  const key = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.HemisphereLight>(null);
  const lampA = useRef<THREE.PointLight>(null);
  const lampB = useRef<THREE.PointLight>(null);
  const sign = useRef<THREE.PointLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const fog = useRef<THREE.FogExp2>(null);

  useFrame((state, delta) => {
    // Critically damped blend: light settles over a few seconds, never snaps.
    const k = 1 - Math.exp(-delta * 0.9);

    if (key.current) {
      key.current.intensity += (target.keyIntensity - key.current.intensity) * k;
      key.current.color.lerp(scratch.set(target.keyColor), k);
      key.current.position.lerp(
        tmp2.set(target.keyPosition[0], target.keyPosition[1], target.keyPosition[2]),
        k,
      );
    }
    if (ambient.current) {
      ambient.current.intensity += (target.ambientIntensity - ambient.current.intensity) * k;
      ambient.current.color.lerp(scratch.set(target.ambientColor), k);
    }
    for (const lamp of [lampA.current, lampB.current]) {
      if (!lamp) continue;
      lamp.intensity += (target.lampIntensity * 9 - lamp.intensity) * k;
      lamp.color.lerp(scratch.set(target.lampColor), k);
    }
    if (sign.current) {
      sign.current.intensity += (target.signIntensity * 7 - sign.current.intensity) * k;
    }
    if (spot.current) {
      // The display spot warms slightly toward the garment under the light.
      const want = focusColor ?? scratch.set(target.lampColor);
      spot.current.color.lerp(want, k * 0.6);
      spot.current.intensity += (target.lampIntensity * 14 + 6 - spot.current.intensity) * k;
    }
    if (fog.current) {
      fog.current.color.lerp(scratch.set(target.fogColor), k);
      fog.current.density += (target.fogDensity - fog.current.density) * k;
    }
    if (state.scene.background instanceof THREE.Color) {
      state.scene.background.lerp(scratch.set(target.background), k);
    }
    state.gl.toneMappingExposure +=
      (target.exposure - state.gl.toneMappingExposure) * k;
  });

  const shadows = quality === "high" ? 2048 : quality === "medium" ? 1024 : 0;

  return (
    <>
      <color attach="background" args={[target.background]} />
      <fogExp2 ref={fog} attach="fog" args={[target.fogColor, target.fogDensity]} />

      {/* Window light — the sun, through the tall arched windows */}
      <directionalLight
        ref={key}
        position={target.keyPosition}
        intensity={target.keyIntensity}
        color={target.keyColor}
        castShadow={shadows > 0}
        shadow-mapSize-width={shadows || 512}
        shadow-mapSize-height={shadows || 512}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0009}
        shadow-normalBias={0.03}
      />

      {/* Bounce off limestone walls and the honed floor */}
      <hemisphereLight
        ref={ambient}
        args={[target.ambientColor, target.floorTint, target.ambientIntensity]}
      />

      {/* Ceiling lamps over the two garment zones */}
      <pointLight
        ref={lampA}
        position={[-3.8, 3.5, -2.2]}
        distance={11}
        decay={2}
        intensity={target.lampIntensity * 9}
        color={target.lampColor}
      />
      <pointLight
        ref={lampB}
        position={[3.8, 3.5, -2.2]}
        distance={11}
        decay={2}
        intensity={target.lampIntensity * 9}
        color={target.lampColor}
      />

      {/* The backlit NN sign washing the wall behind the counter */}
      <pointLight
        ref={sign}
        position={[0, 2.6, ROOM.backWallZ + 0.7]}
        distance={9}
        decay={2}
        intensity={target.signIntensity * 7}
        color="#ffd79a"
      />

      {/* Display spot: the light that makes a garment feel physically present */}
      <spotLight
        ref={spot}
        position={[0, 4.1, 0.6]}
        angle={0.62}
        penumbra={0.92}
        distance={13}
        decay={2}
        intensity={target.lampIntensity * 14 + 6}
        color={target.lampColor}
        castShadow={shadows >= 1024}
        shadow-mapSize-width={shadows || 512}
        shadow-mapSize-height={shadows || 512}
        shadow-bias={-0.001}
      />

      {/*
        Reflections. Built from light shapes matching the real openings in
        the room rather than downloaded — so it costs nothing on the network
        and always agrees with the architecture.
      */}
      <Environment resolution={quality === "high" ? 256 : 128} frames={1}>
        <color attach="background" args={["#0b0b0b"]} />
        {/* the tall windows */}
        <Lightformer
          form="rect"
          intensity={phase === "night" ? 0.25 : 3.4}
          color={target.keyColor}
          position={[6.4, 2.6, -1.5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 3.2, 1]}
        />
        {/* ceiling coves */}
        <Lightformer
          form="rect"
          intensity={phase === "night" ? 1.1 : 0.7}
          color={target.lampColor}
          position={[0, 4.3, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 5, 1]}
        />
        {/* the sign */}
        <Lightformer
          form="rect"
          intensity={target.signIntensity * 1.6}
          color="#ffd79a"
          position={[0, 2.5, -6.6]}
          scale={[3.4, 1, 1]}
        />
      </Environment>
    </>
  );
}

/* Scratch values, reused every frame so the loop allocates nothing. */
const scratch = new THREE.Color();
const tmp2 = new THREE.Vector3();
