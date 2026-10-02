"use client";

/**
 * The fitting room, in 3D. Its own chunk, like the showroom's canvas.
 *
 * An enclosed European fitting room: ivory linen curtain, a three-way mirror, a
 * bench, brass hooks, and warm light from above — the light in a fitting room is
 * always warmer and softer than the shop floor, because nobody looks good under
 * daylight fluorescents.
 */

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ProceduralEnvironment } from "@/components/showroom/ProceduralEnvironment";
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
          {/* Three walls; the fourth is where the camera stands. Warm Sand
              Beige limewash, the same hand-troweled finish as the showroom —
              a fitting room is the one place where wall colour genuinely
              matters, because it is the colour bouncing back onto the
              customer's face and onto the cloth they are deciding about.
              Lime at 0.96 roughness returns almost perfectly diffuse light,
              which is why it flatters where a glossy wall does not. */}
          <Mat material="limewash" position={[0, 1.35, -1.2]} receiveShadow>
            <planeGeometry args={[2.4, 2.7]} />
          </Mat>
          <Mat material="limewash" position={[-1.2, 1.35, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[2.4, 2.7]} />
          </Mat>
          <Mat material="limewash" position={[1.2, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
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
                    {/* the frame */}
                    <Mat material="bronze" position={[0, 0, -0.015]}>
                      <boxGeometry args={[panel.w + 0.05, 1.96, 0.03]} />
                    </Mat>

                    {/* ── backlighting ──────────────────────────────
                        A halo of warm light behind the glass, which is
                        what every good fitting room has and no changing
                        cubicle does. Light from behind the mirror lifts
                        the face without putting a shadow under anything,
                        and it is the entire reason people look better in
                        a fitting room than they expect to. */}
                    <mesh position={[0, 0, -0.035]}>
                      <planeGeometry args={[panel.w + 0.16, 2.06]} />
                      <meshBasicMaterial color="#ffd9a4" toneMapped={false} transparent opacity={0.5} />
                    </mesh>
                    <pointLight
                      position={[0, 0.5, 0.12]}
                      color="#ffe0b0"
                      intensity={0.85}
                      distance={2.6}
                      decay={2}
                    />
                    <pointLight
                      position={[0, -0.6, 0.12]}
                      color="#ffe0b0"
                      intensity={0.55}
                      distance={2.2}
                      decay={2}
                    />
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
                {/* Gathered to the left, the way a fitting-room curtain is left
                    when the room is open. Drawing it across the opening would
                    put linen between the customer and the mirror. */}
                {Array.from({ length: 5 }, (_, i) => (
                  <Mat
                    key={i}
                    material="linen"
                    position={[-1.06 + i * 0.17, 0, Math.sin(i * 1.7) * 0.05]}
                    castShadow
                  >
                    <boxGeometry args={[0.16, 2.5, 0.05]} />
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

/**
 * The walk in.
 *
 * The camera starts outside the fitting room, at the curtain, and glides to
 * standing position in front of the mirror. It is short — under three seconds
 * — because the customer came here to see a size, not to watch a camera move.
 *
 * The easing is a critically damped approach rather than a keyframed tween:
 * the camera decelerates into place the way a person stops walking, and if the
 * customer starts turning the figure mid-move nothing fights them.
 */
const ENTRY_FROM = new THREE.Vector3(0.05, 1.5, 4.9);

/**
 * How far back the camera has to stand to hold a whole person in frame.
 *
 * A 1.85 m figure has to fit the *vertical* field of view, and a portrait
 * viewport has a narrow horizontal one — so on a phone the camera must step
 * further back than on a desktop or the customer sees a torso. Working it out
 * from the actual aspect ratio is the only way this is right on every screen
 * instead of right on the one it was tuned on.
 */
function standingDistance(fovDeg: number, aspect: number): number {
  const subject = 2.05; // metres of head-to-floor plus a little air
  const vFov = (fovDeg * Math.PI) / 180;
  const byHeight = subject / 2 / Math.tan(vFov / 2);
  // the same check horizontally, for very narrow windows
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const byWidth = 0.95 / 2 / Math.tan(hFov / 2);
  return Math.min(4.4, Math.max(2.3, Math.max(byHeight, byWidth) + 0.25));
}

function CameraEntry({ target }: { target: [number, number, number] }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const look = useRef(new THREE.Vector3(...target));
  const settled = useRef(false);
  const to = useRef(new THREE.Vector3(0.22, 1.32, 2.45));

  /* Recomputed whenever the canvas is resized, so rotating a phone or
     dragging a window never crops the figure. */
  useEffect(() => {
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const fov = "fov" in camera ? (camera.fov as number) : 44;
    to.current.set(0.22, 1.32, standingDistance(fov, aspect));
    if (settled.current) {
      camera.position.copy(to.current);
      camera.lookAt(look.current);
    }
  }, [camera, size.width, size.height]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // With reduced motion the customer is simply already standing there.
    camera.position.copy(reduced ? to.current : ENTRY_FROM);
    settled.current = reduced;
    camera.lookAt(look.current);
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    if (settled.current) return;
    const k = 1 - Math.exp(-delta * 1.9);
    camera.position.lerp(to.current, k);
    camera.lookAt(look.current);
    if (camera.position.distanceTo(to.current) < 0.004) {
      camera.position.copy(to.current);
      settled.current = true;
    }
  });

  return null;
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
      camera={{ fov: 44, position: [0.22, 1.32, 2.45], near: 0.1, far: 30 }}
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
      {/* R3F points a new camera at the origin, which is the figure's feet.
          The entry glides in from the curtain and settles on the chest. */}
      <CameraEntry target={[0, 0.98, 0]} />

      <Suspense fallback={null}>
        {/* Warm and enclosed: a fitting room has no daylight in it. */}
        <ProceduralEnvironment
          keyColour="#ffe3bb"
          fillColour="#8a7b6a"
          daylight={0.25}
          lampColour="#ffdcae"
          lampLevel={1}
          intensity={0.5}
        />
        <Room />
        <group rotation={[0, turn, 0]}>
          <TrialBody body={body} product={product} fit={fit} />
        </group>
      </Suspense>
    </Canvas>
  );
}
