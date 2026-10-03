"use client";

import { ZONES, EYE, B, type Zone } from "./plan";

/**
 * Places in the hall, as points of light.
 *
 * No labels in the room. The HUD already names them. A gold sphere at
 * standing height is enough to walk toward; clicking it is the same as
 * choosing that place in the bar.
 */
export function Markers({
  live,
  activeZone,
  onTeleport,
}: {
  live: boolean;
  activeZone: string;
  onTeleport: (zone: Zone) => void;
}) {
  if (!live) return null;

  return (
    <group>
      {ZONES.map((z) => {
        const on = activeZone === z.id;
        return (
          <mesh
            key={z.id}
            position={[z.at[0], EYE + z.floor * B.gallery.y + 0.35, z.at[1]]}
            onClick={(e) => {
              e.stopPropagation();
              onTeleport(z);
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <sphereGeometry args={[on ? 0.07 : 0.05, 16, 16]} />
            <meshStandardMaterial
              color={on ? "#f7f5ef" : "#c5a059"}
              emissive={on ? "#f7f5ef" : "#c5a059"}
              emissiveIntensity={on ? 1.6 : 0.9}
              roughness={0.35}
              metalness={1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
