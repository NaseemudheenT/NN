"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { B, RAILS, SCONCES } from "./plan";
import type { SkyState } from "@/lib/daytime";

/**
 * The light in the building.
 *
 * The great window faces WEST. That is the entire lighting design, and it
 * is why the hall looks different at four o'clock than at ten — not because
 * a theme switched, but because the sun is somewhere else and this building
 * does not move.
 *
 * With the window's outward normal at -z:
 *     north = (+1,0,0)   west = (0,0,-1)   east = (0,0,+1)   south = (-1,0,0)
 * so for solar azimuth A (clockwise from north) and elevation E,
 *     d = (cos E · cos A, sin E, cos E · sin A)
 *
 * Morning sun is behind the customer and the hall is cool and even. Through
 * the afternoon the beam swings round until, at the golden hour, it comes
 * straight down the nave and lays the arcade across the floor. After sunset
 * the window goes blue and the sconces carry the room.
 *
 * Nothing announces any of it. There is no control for it anywhere.
 */

const WEST = new THREE.Vector3(0, 0, -1);

function sunVector(elevationDeg: number, azimuthDeg: number) {
  const e = THREE.MathUtils.degToRad(elevationDeg);
  const a = THREE.MathUtils.degToRad(azimuthDeg);
  return new THREE.Vector3(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a));
}

export function WorldLight({ sky, quality }: { sky: SkyState; quality: "high" | "low" }) {
  const tint = useMemo(() => new THREE.Color(...sky.rgb), [sky.rgb]);

  const rig = useMemo(() => {
    const d = sunVector(sky.solar.elevation, sky.solar.azimuth);
    /* Below two degrees the sun is gone as far as this room is concerned.
       The solar solver keeps returning a vector long after the last light
       has left, and using it draws beams that climb out of the floor. */
    const up = sky.solar.elevation > 2;
    const west = Math.max(0, d.dot(WEST));
    const east = Math.max(0, -d.dot(WEST));
    return {
      d,
      west: up ? sky.beam * west : 0,
      east: up ? sky.beam * east * 0.7 : 0,
      skylight: THREE.MathUtils.clamp(0.2 + sky.solar.elevation / 44, 0.12, 0.9),
    };
  }, [sky.solar.elevation, sky.solar.azimuth, sky.beam]);

  const sunPos = useMemo(
    () => rig.d.clone().multiplyScalar(95).add(new THREE.Vector3(0, 0, B.endWall.z + 8)),
    [rig.d],
  );
  const entrancePos = useMemo(
    () => rig.d.clone().multiplyScalar(70).add(new THREE.Vector3(0, 0, B.vestibule.front)),
    [rig.d],
  );

  const shadowSize = quality === "high" ? 2048 : 1024;

  return (
    <group>
      <hemisphereLight args={["#c3d6ea", "#6b5a44", rig.skylight * 1.5]} />
      <ambientLight intensity={0.15 + sky.lampLevel * 0.09} color="#f2e8d8" />

      <Sun position={sunPos} intensity={rig.west * 5.6} color={tint} shadowSize={shadowSize} />
      <directionalLight position={entrancePos} intensity={rig.east * 2.2} color={tint} />

      {/* A tall window is a light source with no sun in it, too. Without
          this the hall goes flat the moment the beam swings off-axis, which
          is wrong: a west window on a bright morning is still the brightest
          thing in the room. */}
      <rectAreaLight
        position={[0, 6.6, B.endWall.z + 0.4]}
        rotation-y={Math.PI}
        width={11}
        height={11}
        intensity={rig.skylight * 3.4}
        color="#d6e4f4"
      />

      {/* 2700 K sconces on the piers, both storeys. They come up as the beam
          dies — and because the weather has already pulled the beam down on
          a grey afternoon, they come up then too, exactly as a real shop's
          staff bring them up because it is dark outside. */}
      {SCONCES.map((s) => (
        <pointLight
          key={`${s.x}-${s.y}-${s.z}`}
          position={[s.x, s.y, s.z]}
          intensity={(0.2 + sky.lampLevel * 1.2) * 2.4}
          distance={9}
          decay={2}
          color="#ffbe72"
        />
      ))}

      {/* narrow high-CRI spots on the stock; a shop lights its merchandise
          all day, so these never go fully off */}
      {RAILS.map((r) => (
        <RailSpot key={r.id} x={r.x} z={r.z} floor={r.floor} level={0.5 + sky.lampLevel * 0.75} />
      ))}

      {rig.west > 0.05 ? <Shafts strength={rig.west} tint={tint} direction={rig.d} /> : null}
    </group>
  );
}

/**
 * The sun.
 *
 * Its own component because a directional light's shadow camera is centred
 * on its TARGET, and three.js will not use a target that is not in the
 * scene. Left at the default, the target is the world origin, which puts
 * the window end of the nave outside the shadow map — and that is the half
 * where the arcade's shadows fall, which is the most valuable thing the
 * afternoon sun does in this building.
 */
function Sun({
  position, intensity, color, shadowSize,
}: {
  position: THREE.Vector3; intensity: number; color: THREE.Color; shadowSize: number;
}) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useRef<THREE.Object3D>(null);
  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  return (
    <>
      <object3D ref={target} position={[0, 3, -8]} />
      <directionalLight
        ref={light}
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={45}
        shadow-camera-far={180}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={26}
        shadow-camera-bottom={-24}
        shadow-bias={-0.0005}
        shadow-normalBias={0.035}
      />
    </>
  );
}

function RailSpot({ x, z, floor, level }: { x: number; z: number; floor: number; level: number }) {
  const target = useRef<THREE.Object3D>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const y = floor * B.gallery.y;
  useFrame(() => {
    if (spot.current && target.current) spot.current.target = target.current;
  });
  return (
    <>
      <object3D ref={target} position={[x, y + 1.4, z]} />
      <spotLight
        ref={spot}
        position={[x * 0.82, y + (floor ? B.gallery.height - 0.6 : 6.2), z]}
        angle={0.22}
        penumbra={0.55}
        intensity={level * 22}
        distance={floor ? 7.5 : 12}
        decay={2}
        color="#fff1dd"
      />
    </>
  );
}

/**
 * Visible light shafts.
 *
 * Air carries dust, dust scatters light, and the result is that a strong
 * beam through a tall window can be SEEN rather than only its landing
 * place. Each shaft is swung to lie along the sun's own direction and
 * starts at its window, so they move across the hall through the afternoon
 * and flatten toward the floor as the sun drops.
 */
function Shafts({
  strength, tint, direction,
}: {
  strength: number; tint: THREE.Color; direction: THREE.Vector3;
}) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: tint,
        transparent: true,
        opacity: 0.075 * strength,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [tint, strength],
  );

  const quat = useMemo(() => {
    const into = direction.clone().negate().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), into);
  }, [direction]);

  return (
    <group>
      {B.windows.map((w) => {
        const into = direction.clone().negate().normalize();
        const start = new THREE.Vector3(w.cx, w.sill + w.height * 0.58, B.endWall.z + 0.3);
        const mid = start.clone().add(into.multiplyScalar(14));
        return (
          <mesh key={w.cx} position={mid} quaternion={quat} material={material} renderOrder={2}>
            <boxGeometry args={[w.width * 0.94, w.height * 0.78, 28]} />
          </mesh>
        );
      })}
    </group>
  );
}
