"use client";

/**
 * The fitting room, in 3D. Its own chunk, like the showroom's canvas.
 *
 * An enclosed European fitting room: ivory linen curtain, a three-way mirror, a
 * bench, brass hooks, and warm light from above — the light in a fitting room is
 * always warmer and softer than the shop floor, because nobody looks good under
 * daylight fluorescents.
 */

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import type { BodyEstimate, SizeFit } from "@/lib/fit";
import type { Product } from "@/lib/catalog/types";
import { MATERIALS } from "@/components/showroom/materials";
import { OptionalModel } from "@/components/showroom/OptionalModel";
import { TRIAL_MODELS } from "@/components/showroom/assets";
import { TrialBody } from "./TrialBody";

function Mat({
  material,
  children,
  ...props
}: {
  material: keyof typeof MATERIALS;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "material">) {
  const m = MATERIALS[material] as Record<string, unknown>;
  return (
    <mesh {...props}>
      {children}
      <meshPhysicalMaterial
        color={m.colour as string}
        roughness={m.roughness as number}
        metalness={m.metalness as number}
        sheen={(m.sheen as number) ?? 0}
        sheenColor={(m.sheenColour as string) ?? "#ffffff"}
      />
    </mesh>
  );
}

/** The room: 2.2 m square, 2.7 m high. A real fitting room is small. */
function Room() {
  return (
    <OptionalModel
      path={TRIAL_MODELS.room}
      placeholder={
        <group>
          <Mat material="travertine" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2.4, 2.4]} />
          </Mat>
          {/* three walls; the fourth is where the camera stands */}
          <Mat material="plaster" position={[0, 1.35, -1.2]} receiveShadow>
            <planeGeometry args={[2.4, 2.7]} />
          </Mat>
          <Mat material="plaster" position={[-1.2, 1.35, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[2.4, 2.7]} />
          </Mat>
          <Mat material="plaster" position={[1.2, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[2.4, 2.7]} />
          </Mat>
          <Mat material="ceiling" position={[0, 2.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.4, 2.4]} />
          </Mat>

          {/* the three-way mirror: a centre panel and two angled wings */}
          <OptionalModel
            path={TRIAL_MODELS.mirror}
            placeholder={
              <group position={[0, 1.15, -1.17]}>
                {[
                  { x: 0, ry: 0, w: 0.9 },
                  { x: -0.68, ry: 0.42, w: 0.5 },
                  { x: 0.68, ry: -0.42, w: 0.5 },
                ].map((panel) => (
                  <group key={panel.x} position={[panel.x, 0, 0]} rotation={[0, panel.ry, 0]}>
                    <mesh>
                      <planeGeometry args={[panel.w, 1.9]} />
                      <meshPhysicalMaterial
                        color={MATERIALS.mirror.colour}
                        roughness={0.03}
                        metalness={1}
                        envMapIntensity={1.5}
                      />
                    </mesh>
                    <Mat material="bronze" position={[0, 0, -0.015]}>
                      <boxGeometry args={[panel.w + 0.05, 1.96, 0.03]} />
                    </Mat>
                  </group>
                ))}
              </group>
            }
          />

          {/* the bench */}
          <OptionalModel
            path={TRIAL_MODELS.bench}
            placeholder={
              <group position={[0.82, 0, 0.72]}>
                <Mat material="oak" position={[0, 0.44, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.44, 0.05, 1.0]} />
                </Mat>
                {[-0.42, 0.42].map((z) => (
                  <Mat key={z} material="oak" position={[0, 0.21, z]} castShadow>
                    <boxGeometry args={[0.38, 0.42, 0.05]} />
                  </Mat>
                ))}
              </group>
            }
          />

          {/* NN brass hooks */}
          <OptionalModel
            path={TRIAL_MODELS.hooks}
            placeholder={
              <group position={[-1.16, 1.62, 0]}>
                {[-0.4, 0, 0.4].map((z) => (
                  <group key={z} position={[0, 0, z]}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.009, 0.009, 0.1, 10]} />
                      <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.28} metalness={1} />
                    </mesh>
                    <mesh position={[0.05, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[0.022, 0.008, 8, 18, Math.PI]} />
                      <meshPhysicalMaterial color={MATERIALS.brassBright.colour} roughness={0.16} metalness={1} />
                    </mesh>
                  </group>
                ))}
              </group>
            }
          />

          {/* the ivory linen curtain, drawn most of the way across */}
          <OptionalModel
            path={TRIAL_MODELS.curtain}
            placeholder={
              <group position={[0, 1.3, 1.18]}>
                {Array.from({ length: 9 }, (_, i) => (
                  <Mat
                    key={i}
                    material="linen"
                    position={[-0.95 + i * 0.22, 0, Math.sin(i * 1.7) * 0.035]}
                    castShadow
                  >
                    <boxGeometry args={[0.2, 2.5, 0.035]} />
                  </Mat>
                ))}
                {/* brass rail */}
                <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.013, 0.013, 2.3, 12]} />
                  <meshPhysicalMaterial color={MATERIALS.brass.colour} roughness={0.28} metalness={1} />
                </mesh>
              </group>
            }
          />
        </group>
      }
    />
  );
}

export default function TrialRoomCanvas({
  body,
  product,
  fit,
  turn,
}: {
  body: BodyEstimate;
  product: Product | null;
  fit: SizeFit | null;
  /** Rotation of the figure, radians. The customer turns it themselves. */
  turn: number;
}) {
  return (
    <Canvas
      className="absolute inset-0"
      shadows
      dpr={[1, 1.8]}
      camera={{ fov: 42, position: [0, 1.35, 2.5], near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        scene.background = new THREE.Color("#1a1713");
      }}
    >
      {/* Warm, soft, from above and slightly in front — how a good fitting room
          is lit, and why people look better in one than in a changing cubicle. */}
      <ambientLight intensity={0.5} color="#ffe9c9" />
      <directionalLight
        position={[0.6, 3.2, 1.6]}
        intensity={2.4}
        color="#ffdcae"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      {/* a low fill from the mirror, which bounces a surprising amount */}
      <pointLight position={[0, 1.3, -0.9]} intensity={1.1} color="#fff4e2" distance={3.4} />
      <spotLight
        position={[0, 2.6, 0.5]}
        angle={0.7}
        penumbra={0.9}
        intensity={3.2}
        color="#ffe3bb"
        distance={6}
      />
      <Environment preset="apartment" background={false} environmentIntensity={0.4} />

      <Suspense fallback={null}>
        <Room />
        <group rotation={[0, turn, 0]}>
          <TrialBody body={body} product={product} fit={fit} />
        </group>
      </Suspense>
    </Canvas>
  );
}
