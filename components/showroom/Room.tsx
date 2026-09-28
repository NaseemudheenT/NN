"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial, Text } from "@react-three/drei";
import { useMaterials } from "./Materials";
import { ROOM } from "./assets";
import { monogramShapes } from "@/lib/monogram-geometry";
import { LIGHTING, type DayPhase } from "@/lib/tokens";
import type { Quality } from "@/components/layout/ShowroomProvider";

/* ------------------------------------------------------------------ */
/* Floor — honed travertine with the monogram inlaid at the threshold  */
/* ------------------------------------------------------------------ */

function MonogramInlay({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(monogramShapes(), {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    g.center();
    return g;
  }, []);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 0.006, 4.4]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={1.5}
      receiveShadow
    />
  );
}

function Floor({ quality, floorTint }: { quality: Quality; floorTint: string }) {
  if (quality === "high") {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width + 4, ROOM.depth + 6]} />
        <MeshReflectorMaterial
          blur={[420, 110]}
          resolution={1024}
          mixBlur={1}
          mixStrength={22}
          roughness={0.7}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color={floorTint}
          metalness={0.42}
          mirror={0}
        />
      </mesh>
    );
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[ROOM.width + 4, ROOM.depth + 6]} />
      <meshStandardMaterial color={floorTint} roughness={0.36} metalness={0.12} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Shell — limestone walls, coffered ceiling, tall windows             */
/* ------------------------------------------------------------------ */

function ArchedWindowWall({
  materials,
  phase,
}: {
  materials: ReturnType<typeof useMaterials>;
  phase: DayPhase;
}) {
  const bays = [-4.2, -0.4, 3.4];
  const skyColor = LIGHTING[phase].keyColor;
  // The opening is brighter than the wall at every hour except night.
  const skyOpacity = phase === "night" ? 0.35 : 0.94;

  return (
    <group position={[ROOM.rightWallX, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {/* sill band and header band, so the openings read as real windows */}
      <mesh position={[0, 0.55, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROOM.depth, 1.1, 0.3]} />
        <primitive object={materials.limestone} attach="material" />
      </mesh>
      <mesh position={[0, 4.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROOM.depth, 0.7, 0.3]} />
        <primitive object={materials.limestone} attach="material" />
      </mesh>

      {bays.map((z, i) => (
        <group key={z} position={[z, 0, 0]}>
          {/* the opening: daylight, not a texture */}
          <mesh position={[0, 2.5, -0.02]}>
            <planeGeometry args={[2.5, 3.1]} />
            <meshBasicMaterial color={skyColor} toneMapped={false} opacity={skyOpacity} transparent />
          </mesh>
          <mesh position={[0, 4.02, -0.02]}>
            <circleGeometry args={[1.25, 32, 0, Math.PI]} />
            <meshBasicMaterial color={skyColor} toneMapped={false} opacity={skyOpacity} transparent />
          </mesh>
          {/* steel mullions */}
          {[-0.84, 0, 0.84].map((mx) => (
            <mesh key={mx} position={[mx, 2.5, 0.02]} castShadow>
              <boxGeometry args={[0.05, 3.15, 0.09]} />
              <primitive object={materials.steel} attach="material" />
            </mesh>
          ))}
          {[1.55, 2.5, 3.45].map((my) => (
            <mesh key={my} position={[0, my, 0.02]} castShadow>
              <boxGeometry args={[2.5, 0.045, 0.09]} />
              <primitive object={materials.steel} attach="material" />
            </mesh>
          ))}
          {/* a faint glow so the opening reads at night too */}
          {phase === "night" && i === 1 && (
            <pointLight position={[0, 2.6, 0.5]} intensity={0.6} distance={5} color="#7f93ad" />
          )}
        </group>
      ))}

      {/* piers between the bays */}
      {[-6.4, -2.3, 1.5, 5.6].map((z) => (
        <mesh key={z} position={[z, 2.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 3.4, 0.32]} />
          <primitive object={materials.limestone} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Shell({
  materials,
  phase,
}: {
  materials: ReturnType<typeof useMaterials>;
  phase: DayPhase;
}) {
  return (
    <group>
      {/* left wall */}
      <mesh position={[ROOM.leftWallX, ROOM.height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM.depth, ROOM.height]} />
        <primitive object={materials.limestone} attach="material" />
      </mesh>

      {/* back wall, in two panels either side of the fitting-room doorway */}
      <mesh position={[-2.55, ROOM.height / 2, ROOM.backWallZ]} receiveShadow>
        <planeGeometry args={[6.9, ROOM.height]} />
        <primitive object={materials.limestone} attach="material" />
      </mesh>
      <mesh position={[4.35, ROOM.height / 2, ROOM.backWallZ]} receiveShadow>
        <planeGeometry args={[3.3, ROOM.height]} />
        <primitive object={materials.limestone} attach="material" />
      </mesh>
      <mesh position={[1.55, 3.55, ROOM.backWallZ]} receiveShadow>
        <planeGeometry args={[2.3, 1.4]} />
        <primitive object={materials.limestone} attach="material" />
      </mesh>

      {/* ceiling with a recessed cove over the central hall */}
      <mesh position={[0, ROOM.height, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <primitive object={materials.limestoneDark} attach="material" />
      </mesh>
      <mesh position={[0, ROOM.height - 0.16, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 7]} />
        <meshBasicMaterial
          color={phase === "night" ? "#ffc274" : "#fff3dd"}
          toneMapped={false}
          transparent
          opacity={phase === "night" ? 0.62 : 0.26}
        />
      </mesh>

      <ArchedWindowWall materials={materials} phase={phase} />

      {/* columns */}
      {[-3.9, 3.9].map((x) =>
        [-4.6, 1.2].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, ROOM.height / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[0.46, ROOM.height, 0.46]} />
            <primitive object={materials.limestone} attach="material" />
          </mesh>
        )),
      )}

      {/* skirting, so the walls meet the floor like built work */}
      {[
        { p: [ROOM.leftWallX + 0.04, 0.06, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: ROOM.depth },
        { p: [0, 0.06, ROOM.backWallZ + 0.04] as [number, number, number], r: [0, 0, 0] as [number, number, number], w: ROOM.width },
      ].map((s, i) => (
        <mesh key={i} position={s.p} rotation={s.r}>
          <planeGeometry args={[s.w, 0.12]} />
          <primitive object={materials.limestoneDark} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The backlit NN sign and the walnut counter                          */
/* ------------------------------------------------------------------ */

function SignAndCounter({
  materials,
  phase,
}: {
  materials: ReturnType<typeof useMaterials>;
  phase: DayPhase;
}) {
  const signGeometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(monogramShapes(), {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
    });
    g.center();
    return g;
  }, []);

  const glow = LIGHTING[phase].signIntensity;

  return (
    <group position={[-2.5, 0, 0]}>
      {/* the sign, raised off the wall so it throws a halo */}
      <mesh
        geometry={signGeometry}
        position={[0, 2.62, ROOM.backWallZ + 0.16]}
        scale={0.95}
        castShadow
      >
        <meshStandardMaterial
          color="#d6b24d"
          roughness={0.28}
          metalness={0.94}
          emissive="#c9a43a"
          emissiveIntensity={Math.min(glow * 0.45, 1.1)}
        />
      </mesh>
      <Text
        position={[0, 2.02, ROOM.backWallZ + 0.14]}
        fontSize={0.2}
        letterSpacing={0.34}
        color={phase === "night" ? "#e6cf92" : "#4a4236"}
        anchorX="center"
        anchorY="middle"
      >
        NERO NOREN
      </Text>
      <Text
        position={[0, 1.78, ROOM.backWallZ + 0.14]}
        fontSize={0.085}
        letterSpacing={0.42}
        color={phase === "night" ? "#9b8e6d" : "#6f6757"}
        anchorX="center"
        anchorY="middle"
      >
        MEN &amp; BOYS
      </Text>

      {/* walnut counter */}
      <mesh position={[0, 0.5, ROOM.backWallZ + 1.25]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1, 0.72]} />
        <primitive object={materials.walnut} attach="material" />
      </mesh>
      {/* brass toe rail */}
      <mesh position={[0, 0.08, ROOM.backWallZ + 1.62]} castShadow>
        <boxGeometry args={[3.6, 0.05, 0.05]} />
        <primitive object={materials.brassSoft} attach="material" />
      </mesh>
      {/* the embossed shopping bag left on the counter */}
      <mesh position={[1.25, 1.14, ROOM.backWallZ + 1.25]} castShadow>
        <boxGeometry args={[0.34, 0.42, 0.14]} />
        <primitive object={materials.matteBlack} attach="material" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Fitting room doorway with its linen curtain                         */
/* ------------------------------------------------------------------ */

function FittingRoomDoor({ materials }: { materials: ReturnType<typeof useMaterials> }) {
  const curtain = useMemo(() => {
    const g = new THREE.PlaneGeometry(2.1, 2.8, 26, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(x * 5.2) * 0.055);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[1.55, 0, ROOM.backWallZ + 0.02]}>
      {/* the room beyond, warmer and dimmer than the hall */}
      <mesh position={[0, 1.42, -0.3]}>
        <planeGeometry args={[2.3, 2.85]} />
        <meshBasicMaterial color="#2a1f14" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.9, -0.8]} intensity={2.4} distance={4} color="#ffc078" />
      <mesh geometry={curtain} position={[-0.42, 1.4, 0.06]} castShadow>
        <primitive object={materials.linen} attach="material" />
      </mesh>
      {/* brass track and hooks */}
      <mesh position={[0, 2.86, 0.08]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 2.3, 12]} />
        <primitive object={materials.brass} attach="material" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Fixtures: brass rails, oak table, mannequins, mirror, bench         */
/* ------------------------------------------------------------------ */

function BrassRail({
  materials,
  position,
  length = 3.2,
}: {
  materials: ReturnType<typeof useMaterials>;
  position: [number, number, number];
  length?: number;
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, length, 16]} />
        <primitive object={materials.brass} attach="material" />
      </mesh>
      {[-length / 2 + 0.12, length / 2 - 0.12].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, -0.9, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.028, 1.8, 12]} />
            <primitive object={materials.brassSoft} attach="material" />
          </mesh>
          <mesh position={[0, -1.79, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.03, 20]} />
            <primitive object={materials.brassSoft} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OakTable({ materials }: { materials: ReturnType<typeof useMaterials> }) {
  return (
    <group position={[4.1, 0, -2.4]}>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.07, 3]} />
        <primitive object={materials.oak} attach="material" />
      </mesh>
      {[
        [-0.6, -1.3],
        [0.6, -1.3],
        [-0.6, 1.3],
        [0.6, 1.3],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.3, z]} castShadow>
          <boxGeometry args={[0.07, 0.6, 0.07]} />
          <primitive object={materials.oak} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Mannequin({
  materials,
  position,
  rotation = 0,
}: {
  materials: ReturnType<typeof useMaterials>;
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* base and stand */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.27, 0.04, 28]} />
        <primitive object={materials.brassSoft} attach="material" />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.86, 12]} />
        <primitive object={materials.brassSoft} attach="material" />
      </mesh>
      {/* torso */}
      <mesh position={[0, 1.22, 0]} castShadow receiveShadow scale={[1, 1, 0.62]}>
        <capsuleGeometry args={[0.2, 0.52, 6, 18]} />
        <primitive object={materials.matteBlack} attach="material" />
      </mesh>
      {/* shoulder line */}
      <mesh position={[0, 1.52, 0]} rotation={[0, 0, Math.PI / 2]} castShadow scale={[1, 1, 0.55]}>
        <capsuleGeometry args={[0.095, 0.4, 6, 14]} />
        <primitive object={materials.matteBlack} attach="material" />
      </mesh>
      {/* neck */}
      <mesh position={[0, 1.71, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.2, 14]} />
        <primitive object={materials.matteBlack} attach="material" />
      </mesh>
    </group>
  );
}

function Mirror({
  materials,
  quality,
}: {
  materials: ReturnType<typeof useMaterials>;
  quality: Quality;
}) {
  return (
    <group position={[ROOM.leftWallX + 0.22, 0, -4.6]} rotation={[0, Math.PI / 2, 0]}>
      {/* antique bronze frame */}
      <mesh position={[0, 1.55, -0.04]} castShadow>
        <boxGeometry args={[1.14, 2.6, 0.07]} />
        <primitive object={materials.bronze} attach="material" />
      </mesh>
      <mesh position={[0, 1.55, 0.015]}>
        <planeGeometry args={[1, 2.46]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            blur={[180, 60]}
            resolution={512}
            mixBlur={0.6}
            mixStrength={40}
            roughness={0.16}
            color="#cfcdc6"
            metalness={0.85}
            mirror={0.9}
          />
        ) : (
          <meshStandardMaterial color="#a7a49b" roughness={0.18} metalness={0.9} />
        )}
      </mesh>
    </group>
  );
}

function Bench({ materials }: { materials: ReturnType<typeof useMaterials> }) {
  return (
    <group position={[-2.4, 0, 2.6]}>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.45]} />
        <primitive object={materials.oak} attach="material" />
      </mesh>
      {[-0.66, 0.66].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.07, 0.4, 0.4]} />
          <primitive object={materials.brassSoft} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function Room({
  phase,
  quality,
  children,
}: {
  phase: DayPhase;
  quality: Quality;
  children?: React.ReactNode;
}) {
  const materials = useMaterials(LIGHTING[phase].floorTint);

  return (
    <group>
      <Floor quality={quality} floorTint={LIGHTING[phase].floorTint} />
      <MonogramInlay material={materials.brass} />
      <Shell materials={materials} phase={phase} />
      <SignAndCounter materials={materials} phase={phase} />
      <FittingRoomDoor materials={materials} />

      <BrassRail materials={materials} position={[-4.35, 1.85, -2.4]} length={3.4} />
      <BrassRail materials={materials} position={[-4.35, 1.85, 1.6]} length={2.4} />
      <OakTable materials={materials} />
      <Mannequin materials={materials} position={[-1.5, 0, -0.4]} rotation={0.42} />
      <Mannequin materials={materials} position={[1.6, 0, -1.1]} rotation={-0.3} />
      <Mirror materials={materials} quality={quality} />
      <Bench materials={materials} />

      {children}
    </group>
  );
}
