"use client";

/**
 * The garments, in 3D.
 *
 * Each piece loads its own .glb when Shopify has given us a path in the
 * nn.model_glb metafield and the file is present. Until then it draws in the
 * product's real cloth colour at the real size, with the details the brand
 * insists on: the woven NN back-neck label, NN engraved buttons, the placket,
 * the pressed crease, the single forward pleat where there is one.
 *
 * Cloth is rendered with sheen, which is what separates a shirt from a painted
 * box: real fabric scatters light off its fibre ends at grazing angles.
 */

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Product } from "@/lib/catalog/types";
import { MATERIALS } from "../materials";
import { OptionalModel } from "../OptionalModel";
import { garmentModel } from "../assets";
import { MonogramMesh } from "@/components/brand/MonogramMesh";
import { Hanger } from "./Fixtures";

/* ── cloth ─────────────────────────────────────────────────────── */

function Cloth({
  colour,
  kind = "cotton",
  children,
  ...props
}: {
  colour: string;
  kind?: "cotton" | "twill";
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "material">) {
  const base = MATERIALS[kind];
  return (
    <mesh {...props}>
      {children}
      <meshPhysicalMaterial
        color={colour}
        roughness={base.roughness}
        metalness={0}
        sheen={base.sheen}
        sheenColor={base.sheenColour}
        sheenRoughness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── the woven NN back-neck label ─────────────────────────────── */

/**
 * A real label: an ivory woven tape with the monogram woven in gold, stitched
 * across the inside of the back neck. It faces backwards, so it is only visible
 * once the garment is turned around — which is exactly the brief.
 */
export function BackNeckLabel({
  position = [0, 0, 0] as [number, number, number],
  width = 0.055,
}: {
  position?: [number, number, number];
  width?: number;
}) {
  const thread = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({ color: "#c9a43a", roughness: 0.44, metalness: 0.7 }),
    [],
  );

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* the tape */}
      <mesh castShadow>
        <planeGeometry args={[width, width * 0.5]} />
        <meshPhysicalMaterial
          color="#efe9dd"
          roughness={0.86}
          metalness={0}
          sheen={0.5}
          sheenColor="#fffdf6"
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the monogram, woven in gold thread */}
      <group position={[0, width * 0.04, 0.0008]}>
        <MonogramMesh height={width * 0.3} depth={0.0004} bevel={0} material={thread} />
      </group>
      {/* the stitch line across the top */}
      <mesh position={[0, width * 0.24, 0.0004]}>
        <planeGeometry args={[width * 0.94, 0.0012]} />
        <meshBasicMaterial color="#b8ae9c" />
      </mesh>
    </group>
  );
}

/** NN engraved button. */
function Button({ position, colour = "#f4f1e8" }: { position: [number, number, number]; colour?: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.0075, 0.0075, 0.0018, 14]} />
        <meshPhysicalMaterial color={colour} roughness={0.34} metalness={0} clearcoat={0.6} />
      </mesh>
      {/* the engraved rim that catches the light */}
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0048, 0.0006, 6, 14]} />
        <meshPhysicalMaterial color="#c9a43a" roughness={0.4} metalness={0.8} />
      </mesh>
    </group>
  );
}

/* ── a shirt on a hanger ──────────────────────────────────────── */

export interface GarmentProps {
  product: Product;
  position: [number, number, number];
  rotation?: number;
  /** Highlighted because the pointer is over it, or it is the featured piece. */
  active?: boolean;
  onSelect?: (product: Product) => void;
}

export function HangingShirt({ product, position, rotation = 0, active, onSelect }: GarmentProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const lift = useRef(0);

  // On hover the shirt turns a few degrees and lifts on the hanger, the way a
  // garment does when someone takes it off the rail to look at it.
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = hovered || active ? 1 : 0;
    lift.current += (target - lift.current) * Math.min(1, delta * 5);
    group.current.position.y = position[1] + lift.current * 0.035;
    group.current.rotation.y = rotation + lift.current * 0.38;
  });

  const isOxford = product.style === "oxford";

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(product);
      }}
    >
      <Hanger position={[0, 0, 0]} />

      <OptionalModel
        path={product.modelGlb ?? garmentModel(product.handle, "hanger")}
        placeholder={
          <group position={[0, -0.13, 0]}>
            {/* body: an open tapered cylinder reads as cloth hanging, and the
                open ends mean you can see into the collar */}
            <Cloth colour={product.hex} castShadow receiveShadow>
              <cylinderGeometry args={[0.185, 0.16, 0.74, 26, 1, true]} />
            </Cloth>

            {/* sleeves, hanging slightly away from the body */}
            {[-1, 1].map((side) => (
              <Cloth
                key={side}
                colour={product.hex}
                position={[side * 0.2, -0.16, 0.01]}
                rotation={[0, 0, side * 0.16]}
                castShadow
              >
                <cylinderGeometry args={[0.055, 0.042, 0.56, 14, 1, true]} />
              </Cloth>
            ))}

            {/* collar: a band round the neck, standing up */}
            <Cloth colour={product.hex} position={[0, 0.37, 0]}>
              <cylinderGeometry args={[0.072, 0.066, 0.055, 20, 1, true]} />
            </Cloth>
            {/* collar points: button-down on the Oxford, spread on the Poplin */}
            {isOxford
              ? [-1, 1].map((side) => (
                  <Cloth
                    key={side}
                    colour={product.hex}
                    position={[side * 0.038, 0.33, 0.062]}
                    rotation={[0.3, side * 0.2, 0]}
                  >
                    <planeGeometry args={[0.05, 0.062]} />
                  </Cloth>
                ))
              : [-1, 1].map((side) => (
                  <Cloth
                    key={side}
                    colour={product.hex}
                    position={[side * 0.052, 0.335, 0.055]}
                    rotation={[0.24, side * 0.55, 0]}
                  >
                    <planeGeometry args={[0.058, 0.055]} />
                  </Cloth>
                ))}

            {/* placket down the front */}
            <mesh position={[0, 0.02, 0.163]}>
              <planeGeometry args={[0.026, 0.68]} />
              <meshPhysicalMaterial
                color={product.hex}
                roughness={0.68}
                metalness={0}
                sheen={0.5}
                sheenColor="#ffffff"
              />
            </mesh>

            {/* NN engraved buttons down the placket */}
            {[0.26, 0.14, 0.02, -0.1, -0.22].map((y) => (
              <Button key={y} position={[0, y, 0.171]} />
            ))}

            {/* the woven stripe, where the cloth has one */}
            {product.stripe ? (
              <group>
                {Array.from({ length: 22 }, (_, i) => {
                  const a = (i / 22) * Math.PI * 2;
                  return (
                    <mesh
                      key={i}
                      position={[Math.sin(a) * 0.178, 0.02, Math.cos(a) * 0.178]}
                      rotation={[0, a, 0]}
                    >
                      <planeGeometry args={[0.004, 0.72]} />
                      <meshPhysicalMaterial color={product.stripe} roughness={0.72} metalness={0} />
                    </mesh>
                  );
                })}
              </group>
            ) : null}

            {/* the back-neck label — visible when the shirt is turned round */}
            <BackNeckLabel position={[0, 0.325, -0.068]} />
          </group>
        }
      />
    </group>
  );
}

/* ── folded trousers on the oak table ─────────────────────────── */

export function FoldedTrouser({ product, position, rotation = 0, active, onSelect }: GarmentProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const raise = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = hovered || active ? 1 : 0;
    raise.current += (target - raise.current) * Math.min(1, delta * 6);
    group.current.position.y = position[1] + raise.current * 0.018;
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, rotation, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(product);
      }}
    >
      <OptionalModel
        path={product.modelGlb ?? garmentModel(product.handle, "folded")}
        placeholder={
          <group>
            {/* three folds, each a little smaller, the way a shop folds trousers */}
            {[0, 1, 2].map((i) => (
              <Cloth
                key={i}
                kind="twill"
                colour={product.hex}
                position={[0, 0.016 + i * 0.026, 0]}
                rotation={[0, (i - 1) * 0.02, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.34 - i * 0.008, 0.024, 0.27 - i * 0.006]} />
              </Cloth>
            ))}
            {/* the waistband, showing at the top of the stack */}
            <Cloth kind="twill" colour={product.hex} position={[0, 0.094, -0.1]} castShadow>
              <boxGeometry args={[0.33, 0.022, 0.06]} />
            </Cloth>
            {/* the pressed crease, catching the light down the top fold */}
            <mesh position={[0, 0.107, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.002, 0.24]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.16} />
            </mesh>
            {/* the single forward pleat, on the Pleated Trouser */}
            {product.style === "pleat" ? (
              <mesh position={[0.04, 0.107, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.004, 0.1]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.22} />
              </mesh>
            ) : null}
            {/* the label, folded to show */}
            <BackNeckLabel position={[0.1, 0.108, 0.05]} width={0.04} />
          </group>
        }
      />
    </group>
  );
}

/* ── a piece worn on a mannequin ──────────────────────────────── */

export function WornGarment({ product, position, rotation = 0, active, onSelect }: GarmentProps) {
  const [hovered, setHovered] = useState(false);
  const isShirt = product.type === "shirt";

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(product);
      }}
    >
      <OptionalModel
        path={product.modelGlb ?? garmentModel(product.handle, "worn")}
        placeholder={
          isShirt ? (
            <group>
              {/* the shirt over the form's torso */}
              <Cloth colour={product.hex} position={[0, 1.22, 0]} castShadow>
                <cylinderGeometry args={[0.215, 0.185, 0.66, 28, 1, true]} />
              </Cloth>
              {/* shoulders and sleeves */}
              {[-1, 1].map((side) => (
                <Cloth
                  key={side}
                  colour={product.hex}
                  position={[side * 0.215, 1.34, 0]}
                  rotation={[0, 0, side * 0.22]}
                  castShadow
                >
                  <cylinderGeometry args={[0.062, 0.048, 0.5, 14, 1, true]} />
                </Cloth>
              ))}
              {/* collar */}
              <Cloth colour={product.hex} position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.078, 0.072, 0.06, 20, 1, true]} />
              </Cloth>
              <mesh position={[0, 1.24, 0.207]}>
                <planeGeometry args={[0.028, 0.6]} />
                <meshPhysicalMaterial color={product.hex} roughness={0.68} metalness={0} sheen={0.5} />
              </mesh>
              {[1.46, 1.34, 1.22, 1.1, 0.98].map((y) => (
                <Button key={y} position={[0, y, 0.215]} />
              ))}
              <BackNeckLabel position={[0, 1.555, -0.074]} />
              {hovered || active ? (
                <pointLight position={[0, 1.4, 0.6]} intensity={1.4} distance={2.2} color="#fff6e0" />
              ) : null}
            </group>
          ) : (
            <group>
              {/* trousers on the form */}
              <Cloth kind="twill" colour={product.hex} position={[0, 0.74, 0]} castShadow>
                <cylinderGeometry args={[0.175, 0.16, 0.26, 24, 1, true]} />
              </Cloth>
              {[-1, 1].map((side) => (
                <Cloth
                  key={side}
                  kind="twill"
                  colour={product.hex}
                  position={[side * 0.075, 0.33, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.085, 0.062, 0.76, 16, 1, true]} />
                </Cloth>
              ))}
              {/* waistband and belt loops */}
              <Cloth kind="twill" colour={product.hex} position={[0, 0.865, 0]}>
                <cylinderGeometry args={[0.177, 0.175, 0.045, 24, 1, true]} />
              </Cloth>
              {/* the pressed crease down each leg */}
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 0.075, 0.33, 0.086]}>
                  <planeGeometry args={[0.0025, 0.74]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.14} />
                </mesh>
              ))}
              {hovered || active ? (
                <pointLight position={[0, 0.8, 0.6]} intensity={1.2} distance={2} color="#fff6e0" />
              ) : null}
            </group>
          )
        }
      />
    </group>
  );
}

/** Whichever presentation suits where the piece is standing. */
export function Garment(props: GarmentProps & { presentation: "hanger" | "folded" | "worn" }) {
  const { presentation, ...rest } = props;
  if (presentation === "folded") return <FoldedTrouser {...rest} />;
  if (presentation === "worn") return <WornGarment {...rest} />;
  return <HangingShirt {...rest} />;
}
