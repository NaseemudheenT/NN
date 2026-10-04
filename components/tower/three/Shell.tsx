"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  HALF, CHAMFER, SLAB, WALL, LEVELS, PARAPET, DOME_R, DOME_BASE,
  ATRIUM_R, ATRIUM_CENTRE, explodedY, type LevelSpec,
} from "@/lib/tower/spec";
import {
  planShape, plateGeometry, wallGeometry, glazingGeometry, bandGeometry,
  rotundaGlassGeometry, rotundaMullionsGeometry, domeGeometry, domeRibsGeometry,
} from "./geometry";
import { material, lit, kelvinToColor } from "./materials";

/**
 * NN TOWER — the structure.
 *
 * Nine plates, their perimeter walls, the corner rotunda, the mouldings that
 * give the facade its shadow lines, and the glass dome.
 *
 * ── the faces ────────────────────────────────────────────────────────
 * The footprint is a 24 m square with one corner replaced by the rotunda,
 * which leaves four straight elevations of two different lengths. Bay counts
 * are derived from width rather than written down, so every opening on the
 * building sits at roughly the same 4.6 m centres whichever face it is on —
 * which is what makes a facade look designed instead of assembled.
 */

/* Where each straight face sits, in world space, and which way it looks. */
/* Where each straight face sits, which way it looks, and whether the
   cutting plane passes through it. The two that face the default camera
   are the cut ones; the two behind stay, because a section needs a back
   wall or you are looking at furniture floating in the sky. */
const FACES = [
  { w: HALF * 2 - CHAMFER, pos: [-(CHAMFER / 2), 0, HALF] as const, rot: 0, cut: true },
  { w: HALF * 2 - CHAMFER, pos: [HALF, 0, -(CHAMFER / 2)] as const, rot: Math.PI / 2, cut: true },
  { w: HALF * 2, pos: [0, 0, -HALF] as const, rot: Math.PI, cut: false },
  { w: HALF * 2, pos: [-HALF, 0, 0] as const, rot: -Math.PI / 2, cut: false },
];

const baysFor = (width: number) => Math.max(2, Math.round(width / 4.6));

/** The ghost material used for floors that are not in focus. */
const ghostMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#8d8880").convertSRGBToLinear(),
  roughness: 0.9,
  metalness: 0,
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
  side: THREE.DoubleSide,
});

function Level({
  spec,
  explode,
  ghost,
  cutaway,
  onSelect,
}: {
  spec: LevelSpec;
  explode: number;
  ghost: boolean;
  /** Take the two camera-facing walls away and show the rooms. */
  cutaway: boolean;
  onSelect: (s: LevelSpec) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const clear = spec.height - SLAB;

  const plate = useMemo(() => plateGeometry(spec.index >= 1), [spec.index]);
  const walls = useMemo(
    () => FACES.map((f) => wallGeometry(f.w, clear, baysFor(f.w), { sill: spec.index === 0 ? 0.35 : 0.95 })),
    [clear, spec.index],
  );
  const glass = useMemo(
    () => FACES.map((f) => glazingGeometry(f.w, clear, baysFor(f.w), spec.index === 0 ? 0.35 : 0.95)),
    [clear, spec.index],
  );
  const rotGlass = useMemo(() => rotundaGlassGeometry(clear), [clear]);
  const rotBars = useMemo(() => rotundaMullionsGeometry(clear, 7), [clear]);

  /* A dim back-wall standing just inside the glazing.
     The first version of this was a full-size emissive box at the floor's
     own brightness. It was physically wrong — a room is not a light bulb —
     and visually it flooded the entire frame orange, poked out between the
     plates, and bled through the glass HUD. What you actually see through a
     window from the street is a *wall*, softly lit, a long way back. So
     that is what this is: ordinary plaster, no emission, catching the
     floor's interior light. The glow belongs on the glass. */
  const backdrop = useMemo(() => {
    /* Follows the footprint, pulled in 2.6 m, rather than being a square
       box. A square at this size pushes its corner out to 15.5 m from the
       centre while the rotunda glass sits at 14.1 m — so the plain box
       poked straight out through the curved corner of every floor. */
    const g = new THREE.ExtrudeGeometry(planShape(2.6), {
      depth: clear * 0.86,
      bevelEnabled: false,
      curveSegments: 24,
    });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, [clear]);

  /* Floors travel apart on a spring when the model opens. Lerping toward a
     target every frame, rather than tweening on a timer, means a second
     click mid-flight redirects smoothly instead of fighting the first. */
  useFrame((_, dt) => {
    if (!group.current) return;
    const target = spec.base + explodedY(spec.index, explode);
    const k = 1 - Math.pow(0.0015, dt);
    group.current.position.y += (target - group.current.position.y) * k;
  });

  /* The facade is limestone on every floor, because a building has ONE
     exterior material. The ledger's `walls` value is the INTERIOR finish —
     linen on men's & boys, walnut in the archive — and painting it on the
     outside gave a tower with a white storey, a maroon storey and a cream
     storey stacked up like a colour chart. It goes on the core volume
     instead, where it is what you actually see through the windows. */
  const wallMat = ghost ? ghostMaterial : material("limestone");
  const floorMat = ghost ? ghostMaterial : material(spec.floor);
  const roomMat = ghost ? ghostMaterial : material(spec.walls);

  return (
    <group
      ref={group}
      position={[0, spec.base, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(spec);
      }}
    >
      {/* floor plate */}
      <mesh geometry={plate} material={floorMat} castShadow receiveShadow />

      {/* The room behind the glass.
          The lamp that used to be here has gone: every floor module now
          brings its own lighting at its own colour temperature, so the
          shell adding one more per level was lighting all nine floors
          twice — eighteen lights where nine will do, in a forward renderer
          where cost is lights times materials. */}
      {!ghost && (
        <>
          {!cutaway && (
            <mesh
              geometry={backdrop}
              material={roomMat}
              position={[0, SLAB + clear * 0.07, 0]}
              receiveShadow
            />
          )}
        </>
      )}

      {/* Perimeter masonry and its glazing.
          In cutaway the two elevations facing the camera are taken away
          entirely — not made transparent. A sectioned architectural model
          removes the material; it does not turn it to glass, and a ghosted
          wall in front of a room reads as fog over the furniture rather
          than as a building you can see into. */}
      {FACES.map((f, i) => (
        <group key={i} position={[f.pos[0], SLAB, f.pos[2]]} rotation={[0, f.rot, 0]} visible={!(cutaway && f.cut)}>
          <mesh geometry={walls[i]} material={wallMat} castShadow receiveShadow />
          {!ghost && (
            <>
              {/* The warm pane: this is the lit window seen from the street,
                  and the only thing on the facade allowed near the bloom
                  threshold. Tone mapped, so ACES rolls it off instead of
                  letting it clip to white. */}
              <mesh
                geometry={glass[i]}
                material={lit(spec.kelvin, spec.glow * 0.62)}
                position={[0, 0, -WALL * 0.34]}
              />
              {/* and the glass in front of it, set into the reveal the way a
                  real window is — not flush with the face of the stone */}
              <mesh
                geometry={glass[i]}
                material={material("glasspane")}
                position={[0, 0, WALL * 0.12]}
              />
            </>
          )}
        </group>
      ))}

      {/* the corner bay */}
      <group position={[0, SLAB, 0]}>
        {!ghost && (
          <mesh
            geometry={rotGlass}
            material={lit(spec.kelvin, spec.glow * 0.78)}
            scale={[0.985, 1, 0.985]}
          />
        )}
        {!ghost && <mesh geometry={rotGlass} material={material("glasspane")} />}
        <mesh geometry={rotBars} material={ghost ? ghostMaterial : material("steel")} castShadow />
      </group>

      {/* a string course under every plate: the horizontal shadow line that
          stops the elevation reading as a stack of identical boxes */}
      {spec.index > 0 && (
        <mesh
          geometry={bandFor(0.22, 0.26)}
          material={ghost ? ghostMaterial : material("limestone")}
          position={[0, -0.26, 0]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}

/* Bands are identical for every floor, so they are built once and shared. */
const bandCache: Record<string, THREE.BufferGeometry> = {};
function bandFor(project: number, depth: number) {
  const key = `${project}:${depth}`;
  if (!bandCache[key]) bandCache[key] = bandGeometry(project, depth);
  return bandCache[key];
}

export function Shell({
  explode,
  focus,
  cutaway,
  onSelect,
}: {
  explode: number;
  focus: number | null;
  cutaway: boolean;
  onSelect: (s: LevelSpec) => void;
}) {
  const plinth = useMemo(() => bandGeometry(0.5, 1.1), []);
  const cornice = useMemo(() => bandGeometry(0.85, 0.9), []);
  const parapet = useMemo(() => bandGeometry(0.25, 1.25), []);
  const dome = useMemo(() => domeGeometry(DOME_R), []);
  const ribs = useMemo(() => domeRibsGeometry(DOME_R, 20), []);
  const drum = useMemo(
    () => new THREE.CylinderGeometry(DOME_R * 1.04, DOME_R * 1.04, 1.5, 48, 1, false),
    [],
  );

  const domeAt: [number, number, number] = [ATRIUM_CENTRE[0], DOME_BASE, ATRIUM_CENTRE[1]];

  return (
    <group>
      {/* the plinth the whole building stands on */}
      <mesh geometry={plinth} material={material("limestone")} position={[0, -1.1, 0]} receiveShadow castShadow />

      {LEVELS.map((spec) => (
        <Level
          key={spec.id}
          spec={spec}
          explode={explode}
          ghost={focus !== null && focus !== spec.index}
          cutaway={cutaway}
          onSelect={onSelect}
        />
      ))}

      {/* the crown: cornice, then parapet, then the drum and the dome */}
      <group visible={explode < 0.35}>
        <mesh geometry={cornice} material={material("limestone")} position={[0, PARAPET - 0.9, 0]} castShadow receiveShadow />
        <mesh geometry={parapet} material={material("limestone")} position={[0, PARAPET, 0]} castShadow receiveShadow />
        <mesh geometry={drum} material={material("limestone")} position={[domeAt[0], DOME_BASE - 0.6, domeAt[2]]} castShadow receiveShadow />
        <mesh geometry={dome} material={material("glass")} position={domeAt} castShadow />
        <mesh geometry={ribs} material={material("steel")} position={domeAt} castShadow />
        {/* the atrium lantern, seen glowing through the dome from the street */}
        <pointLight position={[domeAt[0], DOME_BASE + 1.4, domeAt[2]]} intensity={48} distance={26} decay={2} color="#ffd9a8" />
        <mesh position={[domeAt[0], DOME_BASE + 1.1, domeAt[2]]} material={lit(2600, 2.4)}>
          <sphereGeometry args={[0.55, 20, 14]} />
        </mesh>
      </group>

      {/* the ground the building sits on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]} receiveShadow>
        <circleGeometry args={[150, 64]} />
        {/* Wet stone paving at dusk: dark, with a clearcoat that returns
            the building's own lit windows as a reflection rather than
            returning the sun as a sheet of orange. */}
        <meshPhysicalMaterial
          color={new THREE.Color("#0d0c0b").convertSRGBToLinear()}
          roughness={0.34}
          metalness={0.0}
          clearcoat={0.65}
          clearcoatRoughness={0.22}
        />
      </mesh>
    </group>
  );
}

export { ATRIUM_R, ATRIUM_CENTRE };
