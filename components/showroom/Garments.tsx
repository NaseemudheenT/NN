"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Product } from "@/lib/types";
import { BRAND } from "@/lib/tokens";

/* ------------------------------------------------------------------ */
/* Procedural garment forms.                                           */
/* These are display forms at true garment scale. They are replaced    */
/* one-for-one by real .glb models via product.modelGlb when the       */
/* simulated garments arrive from CLO 3D.                              */
/* ------------------------------------------------------------------ */

function shirtShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.2, 0);
  s.quadraticCurveTo(-0.09, 0.028, -0.052, 0.03);
  s.quadraticCurveTo(0, 0.072, 0.052, 0.03);
  s.quadraticCurveTo(0.09, 0.028, 0.2, 0);
  s.lineTo(0.262, -0.075);
  s.lineTo(0.238, -0.335);
  s.lineTo(0.181, -0.33);
  s.lineTo(0.172, -0.14);
  s.lineTo(0.186, -0.745);
  s.lineTo(-0.186, -0.745);
  s.lineTo(-0.172, -0.14);
  s.lineTo(-0.181, -0.33);
  s.lineTo(-0.238, -0.335);
  s.lineTo(-0.262, -0.075);
  s.closePath();
  return s;
}

function useShirtGeometry() {
  return useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shirtShape(), {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.026,
      bevelSize: 0.022,
      bevelSegments: 4,
      curveSegments: 12,
    });
    g.translate(0, 0, -0.06);
    g.computeVertexNormals();
    return g;
  }, []);
}

function Hanger({ color = BRAND.brass }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.038, 0.007, 8, 22, Math.PI * 1.55]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.36, 0.012, 0.014]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.25} />
      </mesh>
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * 0.09, 0.055, 0]} rotation={[0, 0, d * -0.95]}>
          <boxGeometry args={[0.2, 0.011, 0.013]} />
          <meshStandardMaterial color={color} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

interface GarmentProps {
  product: Product;
  position: [number, number, number];
  rotation?: number;
  onSelect: (p: Product) => void;
  onHover: (p: Product | null) => void;
  dimmed: boolean;
}

function HangingShirt({ product, position, rotation = 0, onSelect, onHover, dimmed }: GarmentProps) {
  const geometry = useShirtGeometry();
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-delta * 7);

    if (group.current) {
      const liftTo = hovered ? 0.05 : 0;
      group.current.position.y += (position[1] + liftTo - group.current.position.y) * k;
      // Cloth sways barely — enough to read as fabric, never as animation.
      const sway = Math.sin(state.clock.elapsedTime * 0.5 + position[2]) * 0.012;
      group.current.rotation.z += (sway - group.current.rotation.z) * k * 0.4;
    }

    if (material.current) {
      // A garment steps back under the light when another one is approached.
      const want = dimmed && !hovered ? 0.45 : 1;
      material.current.opacity += (want - material.current.opacity) * k;
      material.current.transparent = material.current.opacity < 0.995;
    }
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, rotation, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(product);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(product);
      }}
    >
      <Hanger />
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          ref={material}
          color={product.swatch}
          roughness={0.93}
          metalness={0}
        />
      </mesh>
      {/* the woven NN label at the back neck */}
      <mesh position={[0, -0.045, -0.055]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.055, 0.028]} />
        <meshStandardMaterial color="#101010" roughness={0.9} />
      </mesh>

      {hovered && (
        <Html
          position={[0.3, -0.12, 0]}
          center
          distanceFactor={5.5}
          style={{ pointerEvents: "none" }}
        >
          <div className="nn-glass whitespace-nowrap rounded-sm px-3 py-2 text-left">
            <div className="nn-meta text-ink-faint">{product.colour}</div>
            <div className="font-display text-[1.05rem] leading-tight text-ink">
              {product.title}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function FoldedTrouser({ product, position, onSelect, onHover, dimmed }: GarmentProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 8);

    if (mesh.current) {
      mesh.current.position.y +=
        (position[1] + (hovered ? 0.035 : 0) - mesh.current.position.y) * k;
    }

    if (material.current) {
      const want = dimmed && !hovered ? 0.45 : 1;
      material.current.opacity += (want - material.current.opacity) * k;
      material.current.transparent = material.current.opacity < 0.995;
    }
  });

  return (
    <group>
      <mesh
        ref={mesh}
        position={position}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(product);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(product);
        }}
      >
        <boxGeometry args={[0.92, 0.075, 0.34]} />
        <meshStandardMaterial
          ref={material}
          color={product.swatch}
          roughness={0.88}
          metalness={0}
        />
      </mesh>
      {hovered && (
        <Html position={[position[0], position[1] + 0.3, position[2]]} center distanceFactor={5.5} style={{ pointerEvents: "none" }}>
          <div className="nn-glass whitespace-nowrap rounded-sm px-3 py-2 text-left">
            <div className="nn-meta text-ink-faint">{product.colour}</div>
            <div className="font-display text-[1.05rem] leading-tight text-ink">{product.title}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function Garments({
  products,
  onSelect,
  onHover,
  focusedHandle,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
  onHover: (p: Product | null) => void;
  focusedHandle: string | null;
}) {
  const shirts = products.filter((p) => p.category !== "trousers");
  const trousers = products.filter((p) => p.category === "trousers");

  return (
    <group>
      {/* Shirting — hung on brass, a hand apart, facing the hall */}
      {shirts.slice(0, 6).map((p, i) => {
        const rail = i < 4 ? -2.4 : 1.6;
        const within = i < 4 ? i : i - 4;
        const span = i < 4 ? 3.0 : 2.0;
        const count = i < 4 ? 4 : Math.min(2, shirts.length - 4);
        const z = rail - span / 2 + (span / Math.max(count - 1, 1)) * within;
        return (
          <HangingShirt
            key={p.id}
            product={p}
            position={[-4.32, 1.72, count === 1 ? rail : z]}
            rotation={Math.PI / 2}
            onSelect={onSelect}
            onHover={onHover}
            dimmed={Boolean(focusedHandle) && focusedHandle !== p.handle}
          />
        );
      })}

      {/* Trousers — folded on oak so the leg line is visible */}
      {trousers.slice(0, 4).map((p, i) => (
        <FoldedTrouser
          key={p.id}
          product={p}
          position={[4.1, 0.695 + (i % 2) * 0.08, -3.4 + i * 0.86]}
          onSelect={onSelect}
          onHover={onHover}
          dimmed={Boolean(focusedHandle) && focusedHandle !== p.handle}
        />
      ))}

      {/* Dressed mannequins in the centre of the hall */}
      {shirts[0] && (
        <HangingShirt
          product={shirts[0]}
          position={[-1.5, 1.52, -0.4]}
          rotation={0.42}
          onSelect={onSelect}
          onHover={onHover}
          dimmed={Boolean(focusedHandle) && focusedHandle !== shirts[0].handle}
        />
      )}
      {shirts[2] && (
        <HangingShirt
          product={shirts[2]}
          position={[1.6, 1.52, -1.1]}
          rotation={-0.3}
          onSelect={onSelect}
          onHover={onHover}
          dimmed={Boolean(focusedHandle) && focusedHandle !== shirts[2].handle}
        />
      )}
    </group>
  );
}
