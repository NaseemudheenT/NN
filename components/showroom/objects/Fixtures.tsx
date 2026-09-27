"use client";

/**
 * The fixtures. Each one is its own component with its own placeholder, at the
 * size a joiner would actually build it, in the material the brief specifies.
 *
 * Every dimension below is metres.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { ROOM_MODELS } from "../assets";
import { MATERIALS } from "../materials";
import { OptionalModel } from "../OptionalModel";
import { ROOM, Surface } from "./Room";
import { MonogramMesh } from "@/components/brand/MonogramMesh";

/* ── walnut service counter ────────────────────────────────────── */

export function Counter({ position = [3.4, 0, 2.9] as [number, number, number] }) {
  return (
    <OptionalModel
      path={ROOM_MODELS.counter}
      placeholder={
        <group position={position}>
          {/* carcass */}
          <Surface material="walnut" position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 1.0, 0.68]} />
          </Surface>
          {/* top, slightly proud, with a brass edge */}
          <Surface material="walnut" position={[0, 1.02, 0]} castShadow>
            <boxGeometry args={[2.72, 0.05, 0.76]} />
          </Surface>
          <Surface material="brass" position={[0, 1.02, 0.39]}>
            <boxGeometry args={[2.72, 0.05, 0.012]} />
          </Surface>
          {/* recessed plinth, so the counter reads as floating a little */}
          <Surface material="mannequin" position={[0, 0.04, 0]}>
            <boxGeometry args={[2.4, 0.08, 0.6]} />
          </Surface>
        </group>
      }
    />
  );
}

/* ── the backlit NN wall sign ─────────────────────────────────── */

export function WallSign({
  intensity,
  position = [3.4, 2.5, ROOM.halfD - 0.08] as [number, number, number],
}: {
  intensity: number;
  position?: [number, number, number];
}) {
  // 0.52 m tall letters, deep enough to catch the light box behind them.
  const brass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: MATERIALS.brass.colour,
        roughness: MATERIALS.brass.roughness,
        metalness: 1,
        emissive: new THREE.Color("#c9a43a"),
        emissiveIntensity: intensity * 1.5,
      }),
    [intensity],
  );

  return (
    <OptionalModel
      path={ROOM_MODELS.wallSign}
      placeholder={
        <group position={position}>
          {/* the light box behind the letters */}
          <mesh position={[0, 0, -0.03]}>
            <planeGeometry args={[1.5, 0.78]} />
            <meshBasicMaterial
              color="#efe9dd"
              toneMapped={false}
              transparent
              opacity={0.1 + intensity * 0.55}
            />
          </mesh>
          {/* letters, in brass, glowing when the box is lit */}
          <MonogramMesh height={0.52} depth={0.02} bevel={0.11} material={brass} castShadow />
          {/* a shallow reveal so the box sits in the wall, not on it */}
          <Surface material="steel" position={[0, 0, -0.045]}>
            <boxGeometry args={[1.62, 0.9, 0.03]} />
          </Surface>
          {/* the wash the sign throws onto the wall */}
          <pointLight
            position={[0, 0, 0.35]}
            color="#e8c864"
            intensity={intensity * 2.2}
            distance={3.4}
            decay={2}
          />
        </group>
      }
    />
  );
}

/* ── brushed brass garment rail, 1.8 m ────────────────────────── */

export function Rail({
  position,
  length = 1.8,
  children,
}: {
  position: [number, number, number];
  length?: number;
  children?: React.ReactNode;
}) {
  return (
    <group position={position}>
      <OptionalModel
        path={ROOM_MODELS.rail}
        placeholder={
          <group>
            {/* the tube */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.019, 0.019, length, 20]} />
              <meshPhysicalMaterial
                color={MATERIALS.brass.colour}
                roughness={MATERIALS.brass.roughness}
                metalness={1}
              />
            </mesh>
            {/* wall brackets at the quarter points */}
            {[-length / 2 + 0.12, length / 2 - 0.12].map((x) => (
              <group key={x} position={[x, 0, 0.14]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.013, 0.013, 0.28, 12]} />
                  <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.3} metalness={1} />
                </mesh>
                <mesh position={[0, 0, 0.15]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.012, 16]} />
                  <meshPhysicalMaterial color={MATERIALS.brassBright.colour} roughness={0.16} metalness={1} />
                </mesh>
              </group>
            ))}
          </group>
        }
      />
      {children}
    </group>
  );
}

/* ── NN brass hanger ──────────────────────────────────────────── */

export function Hanger({ position = [0, 0, 0] as [number, number, number] }) {
  const hook = useMemo(() => new THREE.TorusGeometry(0.028, 0.004, 6, 20, Math.PI * 1.4), []);
  return (
    <OptionalModel
      path={ROOM_MODELS.hanger}
      placeholder={
        <group position={position}>
          {/* hook over the rail */}
          <mesh geometry={hook} position={[0, 0.03, 0]} rotation={[0, 0, Math.PI * 0.8]}>
            <meshPhysicalMaterial color={MATERIALS.brassBright.colour} roughness={0.16} metalness={1} />
          </mesh>
          {/* shoulders: two bars angled down from the neck */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.1, -0.035, 0]}
              rotation={[0, 0, side * 0.34]}
              castShadow
            >
              <boxGeometry args={[0.21, 0.009, 0.014]} />
              <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.28} metalness={1} />
            </mesh>
          ))}
          {/* bottom bar */}
          <mesh position={[0, -0.105, 0]}>
            <boxGeometry args={[0.39, 0.006, 0.01]} />
            <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.3} metalness={1} />
          </mesh>
        </group>
      }
    />
  );
}

/* ── low oak table ────────────────────────────────────────────── */

export function Table({ position = [-0.4, 0, -0.9] as [number, number, number], children }: {
  position?: [number, number, number];
  children?: React.ReactNode;
}) {
  return (
    <group position={position}>
      <OptionalModel
        path={ROOM_MODELS.table}
        placeholder={
          <group>
            {/* top */}
            <Surface material="oak" position={[0, 0.44, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.2, 0.055, 0.95]} />
            </Surface>
            {/* a lower shelf, as the brief's low table has */}
            <Surface material="oak" position={[0, 0.16, 0]} castShadow>
              <boxGeometry args={[2.0, 0.035, 0.82]} />
            </Surface>
            {/* four square legs */}
            {[
              [-1.0, 0.22, -0.42], [1.0, 0.22, -0.42],
              [-1.0, 0.22, 0.42], [1.0, 0.22, 0.42],
            ].map(([x, y, z]) => (
              <Surface key={`${x}${z}`} material="oak" position={[x, y, z]} castShadow>
                <boxGeometry args={[0.06, 0.44, 0.06]} />
              </Surface>
            ))}
          </group>
        }
      />
      {children}
    </group>
  );
}

/* ── matte black mannequin ────────────────────────────────────── */

export function Mannequin({
  position,
  rotation = 0,
  children,
}: {
  position: [number, number, number];
  rotation?: number;
  children?: React.ReactNode;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <OptionalModel
        path={ROOM_MODELS.mannequin}
        placeholder={
          <group>
            {/* base */}
            <Surface material="mannequin" position={[0, 0.015, 0]} receiveShadow>
              <cylinderGeometry args={[0.24, 0.28, 0.03, 32]} />
            </Surface>
            {/* stem */}
            <Surface material="steel" position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.68, 12]} />
            </Surface>
            {/* hips */}
            <Surface material="mannequin" position={[0, 0.78, 0]} castShadow>
              <capsuleGeometry args={[0.15, 0.1, 6, 20]} />
            </Surface>
            {/* torso: tapered, the way a tailor's form is */}
            <Surface material="mannequin" position={[0, 1.12, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.16, 0.56, 28]} />
            </Surface>
            {/* chest */}
            <Surface material="mannequin" position={[0, 1.42, 0]} castShadow>
              <capsuleGeometry args={[0.2, 0.12, 8, 24]} />
            </Surface>
            {/* shoulders: a capsule laid on its side across the chest */}
            <Surface
              material="mannequin"
              position={[0, 1.56, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <capsuleGeometry args={[0.075, 0.42, 6, 16]} />
            </Surface>
            {/* neck, cut off as a form is */}
            <Surface material="mannequin" position={[0, 1.68, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.07, 0.14, 16]} />
            </Surface>
          </group>
        }
      />
      {children}
    </group>
  );
}

/* ── full-length antique bronze mirror ────────────────────────── */

export function Mirror({
  position = [ROOM.halfW - 0.1, 1.15, -1.4] as [number, number, number],
  rotation = -Math.PI / 2,
}) {
  return (
    <OptionalModel
      path={ROOM_MODELS.mirror}
      placeholder={
        <group position={position} rotation={[0, rotation, 0]}>
          {/* the glass. A real reflection would need a second render pass; at
              this grazing angle a very smooth metal reads correctly and costs
              nothing, and the real .glb can carry a reflection probe. */}
          <mesh castShadow>
            <planeGeometry args={[0.92, 2.16]} />
            <meshPhysicalMaterial
              color={MATERIALS.mirror.colour}
              roughness={0.03}
              metalness={1}
              envMapIntensity={1.4}
            />
          </mesh>
          {/* bronze frame, four members */}
          {[
            { p: [0, 1.11, -0.02], a: [1.02, 0.06, 0.05] },
            { p: [0, -1.11, -0.02], a: [1.02, 0.06, 0.05] },
            { p: [-0.48, 0, -0.02], a: [0.06, 2.28, 0.05] },
            { p: [0.48, 0, -0.02], a: [0.06, 2.28, 0.05] },
          ].map((m, i) => (
            <Surface
              key={i}
              material="bronze"
              position={m.p as [number, number, number]}
              castShadow
            >
              <boxGeometry args={m.a as [number, number, number]} />
            </Surface>
          ))}
        </group>
      }
    />
  );
}

/* ── doorway to the fitting room ──────────────────────────────── */

export function Doorway({
  position = [ROOM.halfW - 0.06, 0, 2.3] as [number, number, number],
}) {
  return (
    <OptionalModel
      path={ROOM_MODELS.doorway}
      placeholder={
        <group position={position} rotation={[0, -Math.PI / 2, 0]}>
          {/* the dark opening */}
          <mesh position={[0, 1.15, 0]}>
            <planeGeometry args={[1.1, 2.3]} />
            <meshBasicMaterial color="#141210" />
          </mesh>
          {/* oak architrave */}
          {[
            { p: [-0.6, 1.2, 0.03], a: [0.09, 2.44, 0.07] },
            { p: [0.6, 1.2, 0.03], a: [0.09, 2.44, 0.07] },
            { p: [0, 2.38, 0.03], a: [1.29, 0.09, 0.07] },
          ].map((m, i) => (
            <Surface key={i} material="oak" position={m.p as [number, number, number]} castShadow>
              <boxGeometry args={m.a as [number, number, number]} />
            </Surface>
          ))}
          {/* ivory linen curtain, drawn to one side */}
          <Surface material="linen" position={[-0.3, 1.14, 0.06]} castShadow>
            <boxGeometry args={[0.46, 2.26, 0.04]} />
          </Surface>
          {/* brass curtain rod */}
          <mesh position={[0, 2.3, 0.06]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 1.24, 12]} />
            <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.28} metalness={1} />
          </mesh>
        </group>
      }
    />
  );
}

/* ── brass picture lamp ───────────────────────────────────────── */

export function Lamp({
  position,
  intensity,
  target = [0, 1.2, 0] as [number, number, number],
}: {
  position: [number, number, number];
  intensity: number;
  target?: [number, number, number];
}) {
  const targetObject = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...target);
    return o;
  }, [target]);

  return (
    <group position={position}>
      <OptionalModel
        path={ROOM_MODELS.lamp}
        placeholder={
          <group>
            {/* the arm */}
            <mesh position={[0, 0.06, 0.1]} rotation={[Math.PI / 2.6, 0, 0]}>
              <cylinderGeometry args={[0.011, 0.011, 0.26, 10]} />
              <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.3} metalness={1} />
            </mesh>
            {/* the shade, lit from inside */}
            <mesh position={[0, -0.02, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.075, 0.045, 0.13, 20, 1, true]} />
              <meshPhysicalMaterial
                color={MATERIALS.brass.colour}
                roughness={0.24}
                metalness={1}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -0.02, 0.28]}>
              <circleGeometry args={[0.044, 20]} />
              <meshBasicMaterial
                color={MATERIALS.lampShade.emissive}
                toneMapped={false}
                transparent
                opacity={Math.min(1, intensity * 0.5)}
              />
            </mesh>
          </group>
        }
      />
      {/* the light itself. Cheap: no shadow map, since the sun casts the shadows. */}
      <primitive object={targetObject} />
      <spotLight
        position={[0, -0.02, 0.28]}
        target={targetObject}
        color={MATERIALS.lampShade.emissive}
        intensity={intensity * 5}
        angle={0.62}
        penumbra={0.85}
        distance={7}
        decay={1.8}
      />
    </group>
  );
}

/* ── the NN embossed shopping bag on the counter ─────────────── */

export function ShoppingBag({ position = [4.3, 1.05, 2.9] as [number, number, number] }) {
  return (
    <OptionalModel
      path={ROOM_MODELS.shoppingBag}
      placeholder={
        <group position={position}>
          <Surface material="mannequin" position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.12]} />
          </Surface>
          {/* the embossed monogram reads as a slightly proud gold panel */}
          <mesh position={[0, 0.16, 0.062]}>
            <planeGeometry args={[0.12, 0.07]} />
            <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.34} metalness={1} />
          </mesh>
          {/* cord handles */}
          {[-0.07, 0.07].map((x) => (
            <mesh key={x} position={[x, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.035, 0.004, 6, 16, Math.PI]} />
              <meshPhysicalMaterial color="#efe9dd" roughness={0.9} metalness={0} />
            </mesh>
          ))}
        </group>
      }
    />
  );
}
