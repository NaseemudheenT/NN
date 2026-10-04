"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { HALF, SLAB, WALL, LEVELS } from "@/lib/tower/spec";
import { material, lit, kelvinToColor } from "../materials";
import { mergeAll, metricUV } from "../geometry";
import { dressFormGeometry } from "../fixtures";

/**
 * NN TOWER — Level 5. The AI stylist hub and the virtual fit test.
 *
 * The one floor in the building that is not warm. Everything else runs
 * 2500–3400 K; this runs 5000 K, because it is where a customer judges
 * colour. You cannot tell a navy from a charcoal under a filament lamp,
 * which is exactly why every real fitting room is daylight-balanced — and
 * it is why this floor reads as the blue level from the street.
 *
 * ── the pods are the signature ───────────────────────────────────────
 * Cylinders of frosted switchable glass, lit from a ring in the soffit,
 * each with a dress form standing in it. In the founder's reference board
 * these are the unmistakable feature of the whole section — the blue-lit
 * chambers you can pick out from across the building.
 *
 * ── the ceiling is a luminous plane, not a row of lamps ──────────────
 * A stretched-fabric ceiling backlit to an even field is how a fitting
 * room kills shadows on a face and on a shoulder line. Modelled as what it
 * is: a large emissive surface, with the point lights kept low so the fill
 * genuinely comes from above.
 */

const SPEC = LEVELS[5];
const CLEAR = SPEC.height - SLAB;
const INNER = HALF - WALL;
const POD_R = 1.15;
const POD_H = 2.65;

/** Micro-perforated acoustic panelling, curved. */
function curvedPanel(radius: number, arc: number, height: number): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, height, 36, 1, true, -arc / 2, arc);
}

export function Level5({ visible = true }: { visible?: boolean }) {
  const pods = useMemo(
    () => new THREE.CylinderGeometry(POD_R, POD_R, POD_H, 30, 1, true),
    [],
  );
  const podRing = useMemo(() => {
    const g = new THREE.TorusGeometry(POD_R * 0.98, 0.035, 8, 40);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const podBase = useMemo(() => new THREE.CylinderGeometry(POD_R + 0.08, POD_R + 0.12, 0.1, 30), []);
  const form = useMemo(() => dressFormGeometry(0.8), []);
  const panel = useMemo(() => curvedPanel(9.2, Math.PI * 0.62, CLEAR - 0.6), []);

  /* Consultant terminals: a brushed stainless stem and a raked screen. */
  const terminal = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const stem = new THREE.CylinderGeometry(0.05, 0.08, 1.05, 14);
    stem.translate(0, 0.52, 0);
    parts.push(stem);
    const base = new THREE.CylinderGeometry(0.26, 0.3, 0.03, 20);
    base.translate(0, 0.015, 0);
    parts.push(base);
    const screen = metricUV(new THREE.BoxGeometry(0.5, 0.34, 0.025), 0.5, 0.34);
    screen.rotateX(-0.42);
    screen.translate(0, 1.16, 0.05);
    parts.push(screen);
    const m = mergeAll(parts);
    parts.forEach((g) => g.dispose());
    return m;
  }, []);

  /* The fit-test mirror: a tall glass blade with a lit edge. */
  const mirror = useMemo(() => metricUV(new THREE.BoxGeometry(1.25, 2.3, 0.06), 1.25, 2.3), []);

  /* The pods breathe — switchable glass is never quite static, and a
     room that is perfectly still reads as a photograph of a room. */
  const podGroup = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!podGroup.current) return;
    const t = clock.elapsedTime;
    podGroup.current.children.forEach((c, i) => {
      const m = (c as THREE.Group).children[1] as THREE.Mesh | undefined;
      if (m && (m.material as THREE.MeshPhysicalMaterial).opacity !== undefined) {
        (m.material as THREE.MeshPhysicalMaterial).opacity =
          0.5 + Math.sin(t * 0.5 + i * 2.1) * 0.08;
      }
    });
  });

  if (!visible) return null;
  const cool = kelvinToColor(SPEC.kelvin);
  const podAt: [number, number][] = [[4.2, 4.6], [6.8, 1.6], [7.4, -2.4], [5.0, -5.8]];

  return (
    <group position={[0, SPEC.base + SLAB, 0]}>
      {/* the luminous ceiling */}
      <mesh position={[0, CLEAR - 0.14, 0]} material={lit(SPEC.kelvin, 0.52)}>
        <boxGeometry args={[INNER * 2 - 1.4, 0.06, INNER * 2 - 1.4]} />
      </mesh>
      <mesh position={[0, CLEAR - 0.06, 0]} material={material("plaster")} receiveShadow>
        <boxGeometry args={[INNER * 2, 0.12, INNER * 2]} />
      </mesh>

      {/* seamless micro-cement underfoot */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={material("microcement")} receiveShadow>
        <planeGeometry args={[INNER * 2, INNER * 2]} />
      </mesh>

      {/* the curved acoustic wall */}
      <mesh
        geometry={panel}
        material={material("plaster")}
        position={[-3.4, (CLEAR - 0.6) / 2, -2.2]}
        rotation={[0, 0.5, 0]}
        receiveShadow
      />

      {/* the pods */}
      <group ref={podGroup}>
        {podAt.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, i * 0.4, 0]}>
            <mesh geometry={podBase} material={material("brushed")} position={[0, 0.05, 0]} receiveShadow />
            <mesh geometry={pods} material={material("smartglass")} position={[0, POD_H / 2 + 0.1, 0]} />
            <mesh geometry={form} material={material("linen")} position={[0, 0.1, 0]} castShadow />
            {/* the ring that lights it, and the glow that gives this floor
                its colour from outside the building */}
            <mesh geometry={podRing} material={lit(SPEC.kelvin, 1.5)} position={[0, POD_H + 0.06, 0]} />
            <pointLight position={[0, POD_H - 0.2, 0]} intensity={16} distance={6} decay={2} color={cool} />
          </group>
        ))}
      </group>

      {/* fit-test mirrors */}
      {([[-6.6, 3.2, 0.5], [-7.4, -1.2, 1.3]] as const).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={mirror} material={material("brushed")} position={[0, 1.25, 0]} castShadow />
          <mesh position={[0, 1.25, 0.035]} material={material("glasspane")}>
            <planeGeometry args={[1.16, 2.2]} />
          </mesh>
          <mesh position={[0, 1.25, 0.04]} material={lit(SPEC.kelvin, 0.9)}>
            <planeGeometry args={[1.22, 0.02]} />
          </mesh>
        </group>
      ))}

      {/* consultant terminals */}
      {([[-2.6, 6.4, 0.2], [-0.4, 7.0, -0.6]] as const).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh geometry={terminal} material={material("brushed")} castShadow />
          <mesh position={[0, 1.17, 0.06]} rotation={[-0.42, 0, 0]} material={lit(5600, 0.6)}>
            <planeGeometry args={[0.46, 0.3]} />
          </mesh>
        </group>
      ))}

      {/* fill from above, kept low so the ceiling does the work */}
      <pointLight position={[0, CLEAR * 0.82, 0]} intensity={26} distance={24} decay={2} color={cool} />
    </group>
  );
}
