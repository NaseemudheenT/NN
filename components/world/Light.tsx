"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { B, FITTING, RAILS, SCONCES } from "./plan";
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
      {/* Sky above, FLOOR below — and the floor's colour matters more than
          it looks. Every bounce in a stone hall arrives off a warm surface,
          which is why a limestone interior is amber even under a white sun.
          Getting this one swatch wrong is what made the first pass read as
          a grey municipal building. */}
      <hemisphereLight args={["#bcd2ea", "#8a6a44", rig.skylight * 1.9]} />
      <ambientLight intensity={0.2 + sky.lampLevel * 0.12} color="#ffdfae" />

      <Sun position={sunPos} intensity={rig.west * 7.4} color={tint} shadowSize={shadowSize} />
      <directionalLight position={entrancePos} intensity={rig.east * 2.6} color={tint} />

      {/* A tall window is a light source with no sun in it, too. Without
          this the hall goes flat the moment the beam swings off-axis, which
          is wrong: a west window on a bright morning is still the brightest
          thing in the room. */}
      <rectAreaLight
        position={[0, 6.6, B.endWall.z + 0.4]}
        rotation-y={Math.PI}
        width={11}
        height={11}
        intensity={rig.skylight * 5.2}
        color="#dcebff"
      />

      {/* 2700 K sconces on the piers, both storeys. They come up as the beam
          dies — and because the weather has already pulled the beam down on
          a grey afternoon, they come up then too, exactly as a real shop's
          staff bring them up because it is dark outside. */}
      {SCONCES.map((s) => (
        <Sconce
          key={`${s.x}-${s.y}-${s.z}`}
          x={s.x}
          y={s.y}
          z={s.z}
          level={0.22 + sky.lampLevel * 1.25}
        />
      ))}

      {/* ── the aisles ─────────────────────────────────────────
          Every rail in this building stands in an aisle, and the aisles sit
          behind the arcade where neither the window nor the nave's own
          light reaches them. Without this fill they go to black and the
          entire stock of the shop is invisible — which is a lighting
          failure, not a mood. A cove washing the outer wall is what a real
          shop puts there, and it is why you can read a label in the back of
          one. */}
      {[-1, 1].map((side) =>
        [-19, -13, -7, -1, 5].map((z) => (
          <pointLight
            key={`${side}-${z}`}
            position={[side * 8.9, 5.4, z]}
            intensity={2.6 + sky.lampLevel * 2.0}
            distance={9.5}
            decay={2}
            color="#ffdcab"
          />
        )),
      )}
      {/* and the same again along the gallery */}
      {[-1, 1].map((side) =>
        [-17, -10, -3, 4].map((z) => (
          <pointLight
            key={`g${side}-${z}`}
            position={[side * 8.9, B.gallery.y + 4.4, z]}
            intensity={2.2 + sky.lampLevel * 1.8}
            distance={8.5}
            decay={2}
            color="#ffdcab"
          />
        )),
      )}

      {/* the fitting alcove is lit for looking at yourself: frontal, warm,
          and bright enough that a mirror is useful rather than flattering */}
      <pointLight
        position={[FITTING.x - 1.4, 2.1, FITTING.z]}
        intensity={5.5}
        distance={6}
        decay={2}
        color="#fff0dc"
      />

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
 * A sconce on a pier.
 *
 * The light AND the fitting, together, because a point light with no lamp
 * under it is a glow on a wall that nothing is making. The shade is a small
 * emissive cylinder, and it is emissive specifically so that the bloom pass
 * has something genuinely over-bright to catch — a lit fixture in a dark
 * hall is the one thing in a photograph that always blooms.
 */
function Sconce({ x, y, z, level }: { x: number; y: number; z: number; level: number }) {
  const inward = x > 0 ? -1 : 1;
  return (
    <group position={[x, y, z]}>
      <pointLight intensity={level * 3.1} distance={9.5} decay={2} color="#ffb765" />
      {/* the shade, lit from inside */}
      <mesh position={[inward * 0.12, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 0.26, 14, 1, true]} />
        <meshStandardMaterial
          color="#2a211a"
          emissive="#ffc478"
          emissiveIntensity={level * 2.2}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the bracket back to the pier */}
      <mesh position={[-inward * 0.06, -0.02, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
        <meshStandardMaterial color="#c5a059" roughness={0.3} metalness={1} />
      </mesh>
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
        intensity={level * 30}
        distance={floor ? 8 : 13}
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
