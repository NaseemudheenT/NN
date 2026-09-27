"use client";

/**
 * The showroom, assembled.
 *
 * Nothing in here knows what a product is called or what it costs — it is
 * handed whatever the catalogue returned and places it by the piece's own
 * `placement` field, so rearranging the shop floor is a Shopify edit rather
 * than a code change.
 */

import { Html } from "@react-three/drei";
import type { Product } from "@/lib/catalog/types";
import type { SkyState } from "@/lib/daytime";
import { Lighting } from "./Lighting";
import { Room, ROOM } from "./objects/Room";
import {
  Counter,
  Doorway,
  Lamp,
  Mannequin,
  Mirror,
  Rail,
  ShoppingBag,
  Table,
  WallSign,
} from "./objects/Fixtures";
import { FoldedTrouser, HangingShirt, WornGarment } from "./objects/Garments";
import { VIEWPOINTS, type Viewpoint } from "./viewpoints";
import { rigFromSky } from "./lightingRig";

/* ── where things stand ────────────────────────────────────────── */

const RAIL_A: [number, number, number] = [-3.3, 1.82, ROOM.halfD - 0.3];
const RAIL_B: [number, number, number] = [-1.0, 1.82, ROOM.halfD - 0.3];
const TABLE_AT: [number, number, number] = [-0.4, 0, -0.9];
const MANNEQUIN_1: [number, number, number] = [-2.1, 0, 1.5];
const MANNEQUIN_2: [number, number, number] = [1.5, 0, 1.75];

/** Space n garments evenly along a rail of the given length. */
function spread(count: number, length: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const usable = length - 0.3;
  return Array.from({ length: count }, (_, i) => -usable / 2 + (usable / (count - 1)) * i);
}

interface SceneProps {
  products: Product[];
  sky: SkyState;
  quality: "low" | "medium" | "high";
  activeViewpoint: Viewpoint;
  onViewpoint: (id: string) => void;
  onSelect: (product: Product) => void;
  selected?: Product | null;
  /** Hide hotspot pins while the entry move is playing. */
  showHotspots: boolean;
}

export function Scene({
  products,
  sky,
  quality,
  activeViewpoint,
  onViewpoint,
  onSelect,
  selected,
  showHotspots,
}: SceneProps) {
  const rig = rigFromSky(sky);
  const night = sky.phase === "night";

  const at = (placement: Product["placement"]) =>
    products.filter((p) => p.placement === placement);

  const railA = at("rail-a");
  const railB = at("rail-b");
  const onTable = at("table");
  const onMannequin1 = at("mannequin-1");
  const onMannequin2 = at("mannequin-2");

  return (
    <>
      <Lighting sky={sky} quality={quality} />

      <Room windowColour={rig.windowColour} windowIntensity={rig.windowIntensity} night={night} />

      {/* ── fixtures ── */}
      <Counter />
      <ShoppingBag />
      <WallSign intensity={rig.signIntensity} />
      <Mirror />
      <Doorway />

      {/* picture lamps over each rail and the table */}
      <Lamp position={[RAIL_A[0], 3.15, ROOM.halfD - 0.22]} intensity={rig.lampIntensity} target={[RAIL_A[0], 1.5, ROOM.halfD - 0.5]} />
      <Lamp position={[RAIL_B[0], 3.15, ROOM.halfD - 0.22]} intensity={rig.lampIntensity} target={[RAIL_B[0], 1.5, ROOM.halfD - 0.5]} />
      <Lamp position={[TABLE_AT[0], 3.15, TABLE_AT[2] - 0.1]} intensity={rig.lampIntensity * 0.8} target={[TABLE_AT[0], 0.5, TABLE_AT[2]]} />

      {/* ── the shirts, hanging ── */}
      <Rail position={RAIL_A}>
        {spread(railA.length, 1.8).map((x, i) => (
          <HangingShirt
            key={railA[i].handle}
            product={railA[i]}
            position={[x, -0.02, 0]}
            rotation={Math.PI}
            active={selected?.handle === railA[i].handle}
            onSelect={onSelect}
          />
        ))}
      </Rail>

      <Rail position={RAIL_B}>
        {spread(railB.length, 1.8).map((x, i) => (
          <HangingShirt
            key={railB[i].handle}
            product={railB[i]}
            position={[x, -0.02, 0]}
            rotation={Math.PI}
            active={selected?.handle === railB[i].handle}
            onSelect={onSelect}
          />
        ))}
      </Rail>

      {/* ── the trousers, folded on the oak table ── */}
      <Table position={TABLE_AT}>
        {spread(onTable.length, 1.9).map((x, i) => (
          <FoldedTrouser
            key={onTable[i].handle}
            product={onTable[i]}
            position={[x, 0.47, 0]}
            rotation={i % 2 === 0 ? 0.04 : -0.03}
            active={selected?.handle === onTable[i].handle}
            onSelect={onSelect}
          />
        ))}
      </Table>

      {/* ── the two dressed mannequins ── */}
      <Mannequin position={MANNEQUIN_1} rotation={-0.5}>
        {onMannequin1.map((p) => (
          <WornGarment
            key={p.handle}
            product={p}
            position={[0, 0, 0]}
            active={selected?.handle === p.handle}
            onSelect={onSelect}
          />
        ))}
      </Mannequin>

      <Mannequin position={MANNEQUIN_2} rotation={0.7}>
        {onMannequin2.map((p) => (
          <WornGarment
            key={p.handle}
            product={p}
            position={[0, 0, 0]}
            active={selected?.handle === p.handle}
            onSelect={onSelect}
          />
        ))}
      </Mannequin>

      {/* ── hotspots ──
          Real buttons in the 3D space via drei's Html, so they are reachable
          by keyboard and readable by a screen reader — a pin drawn as a mesh
          would be neither. */}
      {showHotspots
        ? VIEWPOINTS.filter((v) => v.pin && v.id !== activeViewpoint.id).map((v) => (
            <Html
              key={v.id}
              position={v.pin!}
              center
              distanceFactor={9}
              occlude={false}
              zIndexRange={[10, 0]}
            >
              <button
                type="button"
                onClick={() => onViewpoint(v.id)}
                className="nn-hotspot"
                aria-label={`Go to the ${v.label.toLowerCase()}. ${v.description}.`}
              >
                <span className="nn-hotspot__ring" aria-hidden="true" />
                <span className="nn-hotspot__label">{v.label}</span>
              </button>
            </Html>
          ))
        : null}
    </>
  );
}
