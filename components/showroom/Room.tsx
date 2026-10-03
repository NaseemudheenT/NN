"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { archBand, archPath, pierceWall } from "./geometry";
import { PLAN } from "./plan";
import { PALETTE, type Materials } from "./materials";

/**
 * The building.
 *
 * Walls are solids with holes cut through them, floors are floors, and the
 * arch soffits are the thickness of the masonry they are cut from. None of
 * it is faked with planes, because the whole effect of the room comes from
 * light raking across surfaces that have real depth — a 600 mm window reveal
 * catching the sun on one jamb and falling into shade on the other is doing
 * more work here than any amount of post-processing.
 */
export function Room({ m, quality }: { m: Materials; quality: "high" | "low" }) {
  const naveLength = PLAN.nave.front - PLAN.nave.back;
  const naveMidZ = (PLAN.nave.front + PLAN.nave.back) / 2;

  /* ── the great window wall ──────────────────────────────────── */
  const endWall = useMemo(
    () =>
      pierceWall(
        PLAN.endWall.width,
        PLAN.nave.height,
        PLAN.endWall.thickness,
        PLAN.windows.map((w) => archPath(w.cx, w.width, w.height, w.sill)),
      ),
    [],
  );

  /* ── the arcade: one long wall each side, pierced once per bay ── */
  const arcadeWall = useMemo(
    () =>
      pierceWall(
        naveLength,
        PLAN.nave.height,
        PLAN.arcade.thickness,
        PLAN.bays.map((z) =>
          archPath(z - naveMidZ, PLAN.arcade.openingWidth, PLAN.arcade.openingHeight),
        ),
      ),
    [naveLength, naveMidZ],
  );

  /* ── the transverse arches across the nave ──────────────────── */
  const band = useMemo(() => archBand(PLAN.arcade.x * 2, 0.55, 1.0), []);

  return (
    <group>
      {/* ── floor ──────────────────────────────────────────────
          Honed basalt laid across the full width, aisles included. It
          receives every shadow in the room, which is what sells the height:
          you read a hall's volume off its floor, not off its walls.

          Where the device can carry it, the floor also takes a real planar
          reflection — the great window smeared down the nave toward you. A
          roughness map can imitate a polished stone's sheen but it cannot
          put the WINDOW in the floor, and the window in the floor is the
          single detail that separates a lit room from a rendered one. The
          mirror is heavily blurred and mixed at a quarter, because honed
          basalt is polished, not a looking-glass. */}
      {quality === "high" ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, naveMidZ]} receiveShadow>
          <planeGeometry args={[PLAN.aisle.x * 2, naveLength + 4]} />
          <MeshReflectorMaterial
            color={PALETTE.stoneFloor}
            roughness={0.42}
            metalness={0.05}
            resolution={512}
            mixBlur={9}
            mixStrength={1.6}
            blur={[380, 110]}
            mirror={0.26}
            depthScale={1.1}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.3}
          />
        </mesh>
      ) : (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, naveMidZ]} receiveShadow material={m.floor}>
          <planeGeometry args={[PLAN.aisle.x * 2, naveLength + 4]} />
        </mesh>
      )}

      {/* a paler inlaid band down the centre of the nave — the walking line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, naveMidZ]}>
        <planeGeometry args={[3.2, naveLength]} />
        <meshStandardMaterial color="#4b443b" roughness={0.34} metalness={0.04} transparent opacity={0.55} />
      </mesh>

      {/* ── the great window wall ─────────────────────────────── */}
      <mesh
        geometry={endWall}
        position={[0, 0, PLAN.endWall.z - PLAN.endWall.thickness]}
        material={m.stone}
        castShadow
        receiveShadow
      />

      {/* ── the arcade, both sides ────────────────────────────── */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={arcadeWall}
          position={[side * PLAN.arcade.x, 0, naveMidZ]}
          rotation-y={side * (Math.PI / 2)}
          material={m.plaster}
          castShadow
          receiveShadow
        />
      ))}

      {/* ── the transverse arches ─────────────────────────────── */}
      {PLAN.bays.map((z) => (
        <mesh
          key={z}
          geometry={band}
          position={[0, PLAN.springline, z]}
          material={m.stone}
          castShadow
          receiveShadow
        />
      ))}

      {/* ── outer aisle walls, in shade behind the arcade ─────── */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * PLAN.aisle.x, PLAN.aisle.height / 2, naveMidZ]}
          rotation-y={-side * (Math.PI / 2)}
          material={m.sand}
          receiveShadow
        >
          <planeGeometry args={[naveLength, PLAN.aisle.height]} />
        </mesh>
      ))}

      {/* aisle ceilings — low, so the nave reads as the tall space */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation-x={Math.PI / 2}
          position={[side * ((PLAN.arcade.x + PLAN.aisle.x) / 2), PLAN.aisle.height, naveMidZ]}
          material={m.sand}
        >
          <planeGeometry args={[PLAN.aisle.x - PLAN.arcade.x, naveLength]} />
        </mesh>
      ))}

      {/* ── nave ceiling and its beams ───────────────────────── */}
      <mesh rotation-x={Math.PI / 2} position={[0, PLAN.nave.height, naveMidZ]} material={m.plaster}>
        <planeGeometry args={[PLAN.arcade.x * 2, naveLength]} />
      </mesh>
      {quality === "high" &&
        Array.from({ length: 22 }, (_, i) => PLAN.nave.back + 1 + i * 1.45).map((z) => (
          <mesh key={z} position={[0, PLAN.nave.height - 0.22, z]} material={m.timber} castShadow>
            <boxGeometry args={[PLAN.arcade.x * 2, 0.44, 0.26]} />
          </mesh>
        ))}

      {/* ── the entrance wall behind the camera, so the room is closed ── */}
      <mesh position={[0, PLAN.nave.height / 2, PLAN.nave.front + 2]} rotation-y={Math.PI} material={m.plaster}>
        <planeGeometry args={[PLAN.aisle.x * 2, PLAN.nave.height]} />
      </mesh>

      {/* ── the dais under the great window ──────────────────── */}
      <mesh position={[0, 0.1, PLAN.endWall.z + 1.6]} material={m.stone} receiveShadow castShadow>
        <boxGeometry args={[11, 0.2, 3.2]} />
      </mesh>

      {/* ── the window reveals pick up a stone sill each ──────── */}
      {PLAN.windows.map((w) => (
        <mesh
          key={w.cx}
          position={[w.cx, w.sill - 0.06, PLAN.endWall.z - 0.3]}
          material={m.stone}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w.width + 0.5, 0.12, 1.0]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * What is outside the windows.
 *
 * A sky that takes its colour from the real sun, a city in silhouette, and
 * the haze between. It exists for one reason: an arched opening with
 * nothing behind it reads as a hole in a wall, and an arched opening with a
 * cathedral five hundred metres away reads as a window. The difference is
 * the whole illusion of standing somewhere.
 */
export function Outside({ tint, lampLevel }: { tint: THREE.Color; lampLevel: number }) {
  const sky = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex };
  }, []);

  /* ── how bright the sky has to be ──────────────────────────────
     Much brighter than it looks like it should. Standing inside a stone hall
     looking out, the exterior is one to two STOPS past anything in the room:
     your eye is adapted to the interior, so the window reads as near-white
     with only the darkest things outside — a cathedral, a roofline — holding
     any detail at all. A sky painted at the value it "is" renders as a flat
     navy panel and the window stops being a window.

     So it is painted hot and lets the tone mapper bring it back: zenith a
     true daylight blue, the band above the roofline nearly white, and the
     horizon the sun's own colour. All of it falls away as the lamps come up
     inside, which is the same event seen from the other side. */
  useMemo(() => {
    const ctx = sky.canvas.getContext("2d");
    if (!ctx) return;
    const day = 1 - lampLevel;
    const mix = (night: number, noon: number) => Math.round(night + (noon - night) * day);
    const warm = (c: number) => Math.round(Math.min(1, c) * 255);
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, `rgb(${mix(14, 104)} ${mix(20, 148)} ${mix(40, 212)})`);
    g.addColorStop(0.5, `rgb(${mix(28, 168)} ${mix(36, 196)} ${mix(58, 232)})`);
    g.addColorStop(0.82, `rgb(${mix(44, 224)} ${mix(48, 230)} ${mix(66, 238)})`);
    /* the last band is the sun's own colour, so a low sun puts gold along
       the roofline and a high one puts white */
    g.addColorStop(1, `rgb(${mix(52, warm(tint.r))} ${mix(50, warm(tint.g))} ${mix(62, warm(tint.b))})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    sky.tex.needsUpdate = true;
  }, [sky, tint, lampLevel]);

  /* ── fog:false on everything out here ───────────────────────────
     Exponential fog at the hall's density is 98% opaque by 240 m, so with
     the interior's haze applied the great window rendered as a flat smear
     of fog colour — a hole in a wall rather than a view, which is the one
     thing that would stop the room reading as a place you are standing in.
     Outdoors, aerial perspective is in the colours instead: everything out
     here is mixed toward the sky, further things more so. */
  /* Distance is in the COLOUR, not in a fog term: the far city is mixed most
     of the way to the sky, the cathedral only a little. Both get LIGHTER as
     the day goes on, because haze between you and a thing scatters daylight
     into it — which is why distant hills are pale at noon and dark at dusk,
     not the other way round.

     The cathedral stays genuinely dark even at midday. Seen from inside a
     hall, anything outside the window is backlit, and a backlit building is
     a silhouette: mid-grey there reads as fog, not as masonry. */
  const silhouette = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: new THREE.Color("#141821").lerp(new THREE.Color("#7f93b0"), 1 - lampLevel),
      fog: false,
    }),
    [lampLevel],
  );
  const silhouetteNear = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: new THREE.Color("#0b0e14").lerp(new THREE.Color("#2b3340"), 1 - lampLevel),
      fog: false,
    }),
    [lampLevel],
  );

  const far = PLAN.endWall.z - 200;

  return (
    <group>
      <mesh position={[0, 54, far]}>
        <planeGeometry args={[760, 400]} />
        <meshBasicMaterial map={sky.tex} toneMapped={false} fog={false} />
      </mesh>

      {/* ── the cathedral ──────────────────────────────────────
          Set OFF the nave's axis and a long way back. Dead centre and close
          it filled the great window edge to edge, which left no sky at all —
          and a window with no sky in it is a painting. Pushed out to the
          left and back to 190 m it sits in the lower two-thirds of the
          opening with daylight around and above it, which is what you
          actually see out of a tall window: a building, and a lot of sky. */}
      <group position={[-13, 0, PLAN.endWall.z - 168]}>
        <mesh position={[0, 11, 0]} material={silhouetteNear}>
          <boxGeometry args={[21, 22, 14]} />
        </mesh>
        {[-7.4, 7.4].map((x) => (
          <group key={x}>
            <mesh position={[x, 21, 1.5]} material={silhouetteNear}>
              <boxGeometry args={[6, 42, 6]} />
            </mesh>
            <mesh position={[x, 49, 1.5]} material={silhouetteNear}>
              <coneGeometry args={[4.6, 16, 4]} />
            </mesh>
          </group>
        ))}
        {/* crossing tower and the nave roof behind it */}
        <mesh position={[0, 30, 0]} material={silhouetteNear}>
          <coneGeometry args={[5.6, 20, 8]} />
        </mesh>
        <mesh position={[0, 23, 0]} rotation-y={Math.PI / 4} material={silhouetteNear}>
          <coneGeometry args={[11.5, 9, 4]} />
        </mesh>
      </group>

      {/* The rest of the city, further back and mixed further toward the sky. */}
      {[
        [16, 7, -186], [27, 10, -214], [-32, 8, -202], [38, 6, -176],
        [-48, 9, -232], [52, 11, -244], [8, 5, -252], [-20, 6, -268],
      ].map(([x, h, z]) => (
        <mesh key={`${x}-${z}`} position={[x, h, PLAN.endWall.z + z]} material={silhouette}>
          <boxGeometry args={[11 + (h % 5) * 3, h * 2, 11]} />
        </mesh>
      ))}

      {/* ground outside, so the city stands on something */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, PLAN.endWall.z - 150]} material={silhouette}>
        <planeGeometry args={[760, 300]} />
      </mesh>
    </group>
  );
}
