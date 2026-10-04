"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { lit } from "./materials";

/**
 * A touchable point in the building.
 *
 * ── why a marker and not just a clickable garment ────────────────────
 * Making the garment mesh itself the click target sounds more natural and
 * is worse: at the distance the camera stands, a coat on a rail is forty
 * pixels of dark cloth against dark cloth, so nobody discovers it is
 * interactive. A small lit point beside it is the convention every
 * architectural walkthrough uses, and it is honest — it says "there is
 * something here" without pretending the room is a game level.
 *
 * ── the pulse is slow on purpose ─────────────────────────────────────
 * Two and a half seconds per breath. A fast pulse reads as an alert; a
 * slow one reads as something lit. This building should never look like it
 * is trying to get your attention.
 */
export function Hotspot({
  position,
  label,
  price,
  onOpen,
}: {
  position: [number, number, number];
  label: string;
  price?: string | null;
  onOpen: () => void;
}) {
  const dot = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  useFrame(({ clock }) => {
    if (!dot.current) return;
    const t = clock.elapsedTime;
    const s = (hover ? 1.5 : 1) * (1 + Math.sin(t * 2.5) * 0.11);
    dot.current.scale.setScalar(s);
  });

  return (
    <group position={position}>
      <mesh
        ref={dot}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        material={lit(2800, hover ? 2.4 : 1.5)}
      >
        <sphereGeometry args={[0.055, 14, 12]} />
      </mesh>
      {/* the halo that makes it findable across a room */}
      <mesh material={lit(2800, 0.3)}>
        <sphereGeometry args={[0.11, 14, 12]} />
      </mesh>

      {hover && (
        <Html center distanceFactor={9} position={[0, 0.34, 0]} zIndexRange={[20, 0]}>
          <div className="nn3-tag">
            <span className="nn3-tag__label">{label}</span>
            {price && <span className="nn3-tag__price">{price}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
