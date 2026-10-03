"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLAN } from "./plan";
import type { SkyState } from "@/lib/daytime";

/**
 * The light.
 *
 * The hall has two openings: the great window at the west end and the
 * entrance at the east. That is the whole lighting design, and it is why the
 * room looks different at four o'clock than at ten — not because a theme
 * switched, but because the sun is somewhere else and this building does not
 * move.
 *
 * ── the building's orientation ──────────────────────────────────────
 * The great window faces WEST. With the window's outward normal at -z:
 *     north = (+1, 0, 0)    west = (0, 0, -1)
 *     south = (-1, 0, 0)    east = (0, 0, +1)
 * so for solar azimuth A (clockwise from north) and elevation E, the unit
 * vector toward the sun is
 *     d = (cos E · cos A, sin E, cos E · sin A)
 *
 * The consequence is a day with real shape to it. Morning sun is behind the
 * visitor and the hall is cool and even, lit by the sky through the window
 * rather than by the sun. Through the afternoon the beam swings round until,
 * at the golden hour, it comes straight down the nave and lays the arcade's
 * shadows across the floor. After sunset the window goes blue and the hall
 * is carried by the sconces and the rail spots.
 *
 * Nothing announces any of this. There is no control for it anywhere.
 */

const WEST = new THREE.Vector3(0, 0, -1);

function sunVector(elevationDeg: number, azimuthDeg: number): THREE.Vector3 {
  const e = THREE.MathUtils.degToRad(elevationDeg);
  const a = THREE.MathUtils.degToRad(azimuthDeg);
  return new THREE.Vector3(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a));
}

export function Lighting({ sky, quality }: { sky: SkyState; quality: "high" | "low" }) {
  const tint = useMemo(() => {
    const [r, g, b] = sky.rgb;
    return new THREE.Color(r, g, b);
  }, [sky.rgb]);

  const rig = useMemo(() => {
    const d = sunVector(sky.solar.elevation, sky.solar.azimuth);

    /* Below two degrees the sun is behind the horizon as far as this room is
       concerned: refraction keeps the solar position solver returning a
       vector long after the last light has gone, and using it draws beams
       that climb out of the floor. */
    const up = sky.solar.elevation > 2;

    const westFacing = Math.max(0, d.dot(WEST)); // 1 when the sun is dead in the window
    const eastFacing = Math.max(0, -d.dot(WEST)); // 1 when it is behind the visitor

    return {
      d,
      /* Direct beam through the great window. */
      west: up ? sky.beam * westFacing : 0,
      /* Direct beam through the entrance, which rakes the floor from behind. */
      east: up ? sky.beam * eastFacing * 0.72 : 0,
      /* Skylight: the whole dome, present whenever the sun is above the
         horizon at all and lingering a while after it sets. */
      skylight: THREE.MathUtils.clamp(0.18 + sky.solar.elevation / 46, 0.1, 0.85),
    };
  }, [sky.solar.elevation, sky.solar.azimuth, sky.beam]);

  /* The sun is placed far enough out that its rays are parallel across the
     hall, which is what makes the window's shadow a clean rectangle on the
     floor rather than a splayed one. */
  const sunPos = useMemo(
    () => rig.d.clone().multiplyScalar(90).add(new THREE.Vector3(0, 0, PLAN.endWall.z + 6)),
    [rig.d],
  );
  const eastPos = useMemo(
    () => rig.d.clone().multiplyScalar(70).add(new THREE.Vector3(0, 0, PLAN.nave.front)),
    [rig.d],
  );

  const shadowSize = quality === "high" ? 2048 : 1024;

  return (
    <group>
      {/* ── skylight ────────────────────────────────────────────
          Sky above, floor bounce below. The ground colour is the floor's own
          stone, because in a real hall the light under a rail comes off the
          floor and arrives the colour of the floor. */}
      <hemisphereLight args={["#c3d6ea", "#6b5a44", rig.skylight * 1.55]} />

      {/* a low ambient so nothing is ever pure black — stone always scatters */}
      <ambientLight intensity={0.14 + sky.lampLevel * 0.08} color="#f2e8d8" />

      {/* ── the sun through the great window ──────────────────── */}
      <Sun
        position={sunPos}
        intensity={rig.west * 5.4}
        color={tint}
        shadowSize={shadowSize}
      />

      {/* ── the sun through the entrance, behind the visitor ──── */}
      <directionalLight position={eastPos} intensity={rig.east * 2.4} color={tint} />

      {/* ── what comes through the window when the sun is elsewhere ──
          A window is a light source even with no sun in it. Without this the
          hall goes flat the moment the beam swings off-axis, which is wrong:
          a tall west window on a bright morning is still the brightest thing
          in the room. */}
      <rectAreaLight
        position={[0, 6.6, PLAN.endWall.z + 0.4]}
        rotation-y={Math.PI}
        width={11}
        height={11}
        intensity={rig.skylight * 3.4}
        color="#d6e4f4"
      />

      {/* ── 2700 K sconces on the piers ────────────────────────
          They come up as the beam dies. On a grey afternoon the weather has
          already pulled the beam down, so the lamps come up then too —
          exactly as the staff of a real shop would bring them up, because it
          is dark outside and not because the clock reached a number. */}
      {PLAN.sconces.map((s) => (
        <pointLight
          key={`${s.x}-${s.z}`}
          position={[s.x, s.y, s.z]}
          /* Pulled well down. A point light sitting against plaster blows a
             white disc onto it; a sconce throws a POOL, and a pool needs the
             source dim enough that the wall behind it is not the brightest
             thing in the hall. */
          intensity={(0.18 + sky.lampLevel * 1.15) * 2.6}
          distance={9.5}
          decay={2}
          color="#ffbe72"
        />
      ))}

      {/* ── the rail spots ─────────────────────────────────────
          Narrow, high-CRI, aimed at the stock. These never go fully off: a
          shop lights its merchandise all day. */}
      {PLAN.rails.map((r) => (
        <SpotOnRail key={`${r.x}-${r.z}`} x={r.x} z={r.z} level={0.55 + sky.lampLevel * 0.7} />
      ))}

      {/* ── the beam itself, where you can see it ─────────────────
          Three additive boxes. Cheap enough to run on the low path too, and
          it is the single thing that most makes the hall read as a volume
          of air rather than a set of surfaces — so it is the last thing that
          should be cut from a weak device, not the first. */}
      {rig.west > 0.05 ? <Shafts strength={rig.west} tint={tint} direction={rig.d} /> : null}
    </group>
  );
}

/**
 * The sun.
 *
 * Its own component for one reason: a directional light's shadow camera is
 * centred on its TARGET, and three.js will not use a target that is not in
 * the scene. Left at the default the target is the world origin, which puts
 * half the nave outside the shadow map — and the half that falls out is the
 * end with the window in it, so the arcade stops laying its bands across the
 * floor, which is the single most valuable thing the low afternoon sun does
 * in this room.
 *
 * The frustum is sized to the hall rather than to a round number, and the
 * near plane starts at 40 m because the light stands 90 m out: starting at
 * 0.1 would spread the depth buffer's precision across 90 m of empty air and
 * spend none of it on the building.
 */
function Sun({
  position,
  intensity,
  color,
  shadowSize,
}: {
  position: THREE.Vector3;
  intensity: number;
  color: THREE.Color;
  shadowSize: number;
}) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  return (
    <>
      <object3D ref={target} position={[0, 2, -9]} />
      <directionalLight
        ref={light}
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={40}
        shadow-camera-far={170}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={24}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0005}
        shadow-normalBias={0.035}
      />
    </>
  );
}

/** One 20° spot per rail, mounted in the ceiling and aimed at the stock. */
function SpotOnRail({ x, z, level }: { x: number; z: number; level: number }) {
  const target = useRef<THREE.Object3D>(null);
  const spot = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    if (spot.current && target.current) spot.current.target = target.current;
  });
  return (
    <>
      <object3D ref={target} position={[x, 1.5, z]} />
      <spotLight
        ref={spot}
        position={[x * 0.84, 6.6, z]}
        angle={0.2}
        penumbra={0.55}
        intensity={level * 26}
        distance={13}
        decay={2}
        color="#fff1dd"
      />
    </>
  );
}

/**
 * Visible light shafts.
 *
 * Air carries dust, dust scatters light, and the result is that a strong beam
 * through a tall window can be SEEN rather than only its landing place. Each
 * shaft is a flattened box in additive blend, swung to lie along the sun's
 * own direction and starting at its window — so the shafts move across the
 * hall through the afternoon, and converge toward the floor as the sun drops.
 *
 * Drawn only when the sun is actually in the window. The guard is in the
 * caller, and it is a real guard: the solar solver happily returns a
 * direction at midnight, and its negation points at the ceiling.
 */
function Shafts({
  strength,
  tint,
  direction,
}: {
  strength: number;
  tint: THREE.Color;
  direction: THREE.Vector3;
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

  /* The shaft runs the opposite way to the sun vector: from the window,
     into the room. */
  const quat = useMemo(() => {
    const into = direction.clone().negate().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), into);
  }, [direction]);

  return (
    <group>
      {PLAN.windows.map((w) => {
        const start = new THREE.Vector3(w.cx, w.sill + w.height * 0.56, PLAN.endWall.z + 0.3);
        const into = direction.clone().negate().normalize();
        const mid = start.clone().add(into.multiplyScalar(13));
        return (
          <mesh key={w.cx} position={mid} quaternion={quat} material={material} renderOrder={2}>
            <boxGeometry args={[w.width * 0.94, w.height * 0.78, 26]} />
          </mesh>
        );
      })}
    </group>
  );
}
