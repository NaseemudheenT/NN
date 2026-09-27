"use client";

/**
 * The concierge at the counter.
 *
 * Someone standing behind the walnut counter, who you can go and ask. Tapping
 * them opens the stylist — the same stylist as the dock and the stylist page,
 * because there is only one.
 *
 * Deliberately a figure rather than a face: a low-polygon attempt at a human
 * face reads as unsettling, and a well-dressed silhouette behind a counter
 * reads as a person without pretending to be a portrait. When a real model is
 * supplied it takes over.
 */

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { MATERIALS } from "../materials";
import { OptionalModel } from "../OptionalModel";
import { MODEL_ROOT } from "../assets";

const CONCIERGE_MODEL = `${MODEL_ROOT}/fixtures/concierge.glb`;

export function Concierge({
  position = [3.4, 0, 3.55] as [number, number, number],
  rotation = Math.PI,
  onAsk,
  /** Warmth of the room, so the figure is lit like everything else. */
  lampIntensity = 0,
}: {
  position?: [number, number, number];
  rotation?: number;
  onAsk: () => void;
  lampIntensity?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const breathe = useRef(0);

  // A very small vertical movement, at about the rate of resting breathing.
  // Without it a standing figure reads as a mannequin; with it, as a person.
  useFrame((state, delta) => {
    if (!group.current) return;
    breathe.current += delta;
    const breath = Math.sin(breathe.current * 0.9) * 0.006;
    const lean = hovered ? 0.05 : 0;
    group.current.position.y = position[1] + breath;
    group.current.rotation.y += (rotation + lean - group.current.rotation.y) * Math.min(1, delta * 4);
  });

  const cloth = (colour: string, roughness = 0.75) => (
    <meshPhysicalMaterial color={colour} roughness={roughness} metalness={0} sheen={0.3} />
  );

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
        onAsk();
      }}
    >
      <OptionalModel
        path={CONCIERGE_MODEL}
        placeholder={
          <group>
            {/* legs, mostly hidden by the counter */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.085, 0.4, 0]} castShadow>
                <capsuleGeometry args={[0.07, 0.62, 6, 12]} />
                {cloth(MATERIALS.twill.colour, 0.82)}
              </mesh>
            ))}
            {/* the trouser waist */}
            <mesh position={[0, 0.82, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.17, 0.18, 20]} />
              {cloth(MATERIALS.twill.colour, 0.82)}
            </mesh>
            {/* a white Oxford, tucked */}
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.185, 0.165, 0.52, 24]} />
              {cloth("#f4f2ed")}
            </mesh>
            {/* shoulders */}
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <capsuleGeometry args={[0.068, 0.3, 6, 14]} />
              {cloth("#f4f2ed")}
            </mesh>
            {/* arms, resting at the counter */}
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.21, 1.17, 0.02]}
                rotation={[0, 0, side * 0.12]}
                castShadow
              >
                <capsuleGeometry args={[0.05, 0.4, 6, 12]} />
                {cloth("#f4f2ed")}
              </mesh>
            ))}
            {/* collar and neck */}
            <mesh position={[0, 1.56, 0]}>
              <cylinderGeometry args={[0.073, 0.067, 0.06, 18]} />
              {cloth("#f4f2ed", 0.7)}
            </mesh>
            <mesh position={[0, 1.62, 0]}>
              <cylinderGeometry args={[0.052, 0.058, 0.1, 14]} />
              <meshPhysicalMaterial color="#c4ab94" roughness={0.68} metalness={0} />
            </mesh>
            {/* the head: a form, not a face */}
            <mesh position={[0, 1.77, 0]} castShadow>
              <capsuleGeometry args={[0.082, 0.08, 8, 18]} />
              <meshPhysicalMaterial color="#c4ab94" roughness={0.7} metalness={0} />
            </mesh>
            {/* hair, as a simple dark cap */}
            <mesh position={[0, 1.83, -0.006]} castShadow>
              <sphereGeometry args={[0.086, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              <meshPhysicalMaterial color="#17130f" roughness={0.85} metalness={0} />
            </mesh>
          </group>
        }
      />

      {/* the invitation, which only appears when you look at them */}
      <Html position={[0, 2.05, 0]} center distanceFactor={9} zIndexRange={[10, 0]}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAsk();
          }}
          className="nn-hotspot"
          aria-label="Ask the NN stylist at the counter"
          style={{
            opacity: hovered ? 1 : 0.55,
            transition: "opacity 420ms var(--ease-showroom)",
          }}
        >
          <span className="nn-hotspot__ring" aria-hidden="true" />
          <span className="nn-hotspot__label">Ask the stylist</span>
        </button>
      </Html>

      {/* a little warmth on the figure at night, so they are not a silhouette */}
      {lampIntensity > 0.1 ? (
        <pointLight position={[0, 1.5, 0.7]} intensity={lampIntensity * 0.9} distance={2.6} color="#ffe0b5" />
      ) : null}
    </group>
  );
}
