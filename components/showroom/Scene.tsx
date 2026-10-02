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
  Rail,
  ShoppingBag,
  Table,
  WallSign,
} from "./objects/Fixtures";
import { FoldedTrouser, HangingShirt, WornGarment } from "./objects/Garments";
import { ArchitecturalLighting } from "./objects/ArchitecturalLighting";
import { ReflectiveMirror } from "./objects/ReflectiveMirror";
import { Topiary } from "./objects/Topiary";
import { LightShafts } from "./objects/LightShafts";
import { Portal } from "./objects/Portal";
import { Concierge } from "./objects/Concierge";
import { openStylist } from "@/components/stylist/StylistDock";
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
  /** 0 on the pavement, 1 once the visitor is through the doors. */
  entryProgress?: number;
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
  entryProgress = 1,
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

      <Room
        windowColour={rig.windowColour}
        windowIntensity={rig.windowIntensity}
        night={night}
        /* A live floor reflection is a second render pass over the whole
           room. It is the thing that makes polished stone read as polished
           stone, and the first thing to go when the device cannot afford it. */
        reflections={quality !== "low"}
        reflectionResolution={quality === "high" ? 1024 : 512}
      />

      {/* the doors the visitor comes through */}
      <Portal progress={entryProgress} night={night} />

      {/* recessed spots, pilaster uplights and the perimeter cove */}
      {/* Olive topiary. The only thing in the room that was not
          manufactured, which is what the eye calibrates the rest against —
          see ./objects/Topiary for why it barely moves. */}
      <Topiary quality={quality} />

      {/* Sunlight made visible: shafts leaning in through the deep-set
          windows, angled by the same solar calculation that aims the key
          light. See ./objects/LightShafts. */}
      <LightShafts sky={sky} quality={quality} />

      <ArchitecturalLighting
        lampColour={rig.lampColour}
        level={sky.lampLevel}
        quality={quality}
      />

      {/* ── fixtures ── */}
      <Counter />
      {/* Someone to ask. Tapping them opens the same stylist as the dock. */}
      <Concierge onAsk={openStylist} lampIntensity={rig.lampIntensity} />
      <ShoppingBag />
      <WallSign intensity={rig.signIntensity} />
      {/* The mirror reflects the actual room on the top tier — see
          ./objects/ReflectiveMirror for why a grey rectangle was not
          good enough once the camera started standing in front of it. */}
      <ReflectiveMirror
        position={[ROOM.halfW - 0.1, 1.15, -1.4]}
        rotation={-Math.PI / 2}
        quality={quality}
      />
      <Doorway />

      {/* picture lamps over each rail and the table */}
      <Lamp position={[RAIL_A[0], 3.15, ROOM.halfD - 0.22]} intensity={rig.lampIntensity} target={[RAIL_A[0], 1.5, ROOM.halfD - 0.5]} />
      <Lamp position={[RAIL_B[0], 3.15, ROOM.halfD - 0.22]} intensity={rig.lampIntensity} target={[RAIL_B[0], 1.5, ROOM.halfD - 0.5]} />
      <Lamp position={[TABLE_AT[0], 3.15, TABLE_AT[2] - 0.1]} intensity={rig.lampIntensity * 0.8} target={[TABLE_AT[0], 0.5, TABLE_AT[2]]} />

      {/* ── the shirts, hanging ── */}
      {/* 1.4 m, not the 1.8 m default: the rail now hangs inside an arched
          niche 1.5 m wide, and a rail wider than its opening would run
          straight into the pier beside it. */}
      <Rail position={RAIL_A} length={1.4}>
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

      <Rail position={RAIL_B} length={1.4}>
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
          would be neither.

          Every pin stays mounted for the life of the scene and is hidden with
          CSS rather than by being removed. Each <Html> owns a separate React
          root, and tearing one down while the canvas is mid-render is what
          produces "attempted to synchronously unmount a root while React was
          already rendering". Hiding costs nothing; unmounting costs a race. */}
      {VIEWPOINTS.filter((v) => v.pin).map((v) => {
        const shown = showHotspots && v.id !== activeViewpoint.id;
        return (
          <Html
            key={v.id}
            position={v.pin!}
            center
            distanceFactor={9}
            occlude={false}
            zIndexRange={[10, 0]}
            style={{
              opacity: shown ? 1 : 0,
              pointerEvents: shown ? "auto" : "none",
              transition: "opacity var(--duration-panel, 520ms) ease",
            }}
          >
            <button
              type="button"
              onClick={() => onViewpoint(v.id)}
              className="nn-hotspot nn-hotspot--viewpoint"
              aria-label={`Go to the ${v.label.toLowerCase()}. ${v.description}.`}
              aria-hidden={!shown}
              tabIndex={shown ? 0 : -1}
            >
              <span className="nn-hotspot__ring" aria-hidden="true" />
              <span className="nn-hotspot__label">{v.label}</span>
            </button>
          </Html>
        );
      })}
    </>
  );
}
