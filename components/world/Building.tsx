"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { archBand, archPath, pierceWall } from "@/components/showroom/geometry";
import { PALETTE, type Materials } from "@/components/showroom/materials";
import { B } from "./plan";

/**
 * The building, in two storeys.
 *
 * Built the way it would be built. The arches are HOLES cut through extruded
 * masonry, so an arch soffit is the real thickness of the wall it is cut
 * from — a 500 mm reveal that catches the light on one jamb and falls into
 * shade on the other. That is doing more work here than any post-processing
 * could: it is what makes a customer believe they are inside something.
 *
 * The second floor is a GALLERY over the aisles rather than a separate room
 * stacked on top. You climb to it, you walk it, and you can look down over
 * its balustrade into the nave — so the two floors are one space, which is
 * how a real multi-level shop reads and why the stair is worth climbing.
 */
export function Building({ m, quality }: { m: Materials; quality: "high" | "low" }) {
  const naveLength = B.vestibule.front - B.nave.back;
  const naveMid = (B.vestibule.front + B.nave.back) / 2;
  const aisleLength = B.nave.front - B.nave.back;
  const aisleMid = (B.nave.front + B.nave.back) / 2;
  const aisleWidth = B.aisle.x - B.arcade.x;

  /* the great window wall */
  const endWall = useMemo(
    () =>
      pierceWall(
        B.endWall.width,
        B.nave.height,
        B.endWall.thickness,
        B.windows.map((w) => archPath(w.cx, w.width, w.height, w.sill)),
      ),
    [],
  );

  /* the arcade: one long wall a side, pierced once per bay on each storey */
  const arcadeWall = useMemo(() => {
    const holes = [
      ...B.bays.map((z) => archPath(z - aisleMid, B.arcade.openingWidth, B.arcade.openingHeight)),
      /* the gallery's own openings, between its floor and the springing —
         this is what lets someone on the second floor look down into the
         nave, so getting the head under the vault matters */
      ...B.bays.map((z) =>
        archPath(z - aisleMid, B.arcade.openingWidth * 0.86, B.arcade.upperHeight, B.gallery.y + 0.1),
      ),
    ];
    return pierceWall(aisleLength, B.nave.height, B.arcade.thickness, holes);
  }, [aisleLength, aisleMid]);

  /* the transverse arches across the nave */
  const band = useMemo(() => archBand(B.arcade.x * 2, B.vaultBand, 1.0, B.vaultRise), []);

  /* ── the stair ───────────────────────────────────────────────── */
  const stair = useMemo(() => {
    const rise = B.gallery.y / B.stair.steps;
    const run = (B.stair.bottomZ - B.stair.topZ) / B.stair.steps;
    return Array.from({ length: B.stair.steps }, (_, i) => ({
      y: rise * (i + 0.5),
      z: B.stair.bottomZ - run * (i + 0.5),
      h: rise,
      d: run,
    }));
  }, []);

  return (
    <group>
      {/* ══ ground floor ═════════════════════════════════════════
          Nero Marquina, polished. Where the device can carry it the floor
          takes a real planar reflection: the great window smeared down the
          nave toward you. A roughness value can imitate a sheen but it
          cannot put the WINDOW in the floor, and that one thing is most of
          the difference between a lit room and a rendered one. */}
      {quality === "high" ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, naveMid]} receiveShadow>
          <planeGeometry args={[B.aisle.x * 2, naveLength]} />
          <MeshReflectorMaterial
            color={PALETTE.stoneFloor}
            roughness={0.38}
            metalness={0.12}
            resolution={512}
            mixBlur={8}
            mixStrength={2.1}
            blur={[340, 100]}
            mirror={0.34}
            depthScale={1.1}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.4}
          />
        </mesh>
      ) : (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, naveMid]} receiveShadow material={m.marble}>
          <planeGeometry args={[B.aisle.x * 2, naveLength]} />
        </mesh>
      )}

      {/* a pale inlaid band down the centre — the walking line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, naveMid]}>
        <planeGeometry args={[3.4, naveLength]} />
        <meshStandardMaterial color={PALETTE.travertine} roughness={0.3} metalness={0.05} transparent opacity={0.5} />
      </mesh>

      {/* ══ the arcade ═══════════════════════════════════════════ */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={arcadeWall}
          position={[side * B.arcade.x, 0, aisleMid]}
          rotation-y={side * (Math.PI / 2)}
          material={m.plaster}
          castShadow
          receiveShadow
        />
      ))}

      {/* ══ the gallery ══════════════════════════════════════════
          A slab over each aisle, and a bridge across the window end so the
          two sides join and the circuit closes — a gallery you have to walk
          back down is a dead end, not a floor. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            rotation-x={-Math.PI / 2}
            position={[side * ((B.arcade.x + B.aisle.x) / 2), B.gallery.y, aisleMid]}
            receiveShadow
            material={m.stone}
          >
            <planeGeometry args={[aisleWidth, aisleLength]} />
          </mesh>
          {/* its underside, which is the aisle's ceiling */}
          <mesh
            rotation-x={Math.PI / 2}
            position={[side * ((B.arcade.x + B.aisle.x) / 2), B.gallery.y - 0.3, aisleMid]}
            material={m.sand}
          >
            <planeGeometry args={[aisleWidth, aisleLength]} />
          </mesh>
          {/* the edge of the slab, seen from the nave */}
          <mesh
            position={[side * (B.arcade.x - 0.12), B.gallery.y - 0.15, aisleMid]}
            material={m.stone}
            castShadow
          >
            <boxGeometry args={[0.3, 0.3, aisleLength]} />
          </mesh>
        </group>
      ))}

      {/* ── the bridge ───────────────────────────────────────
          Over the ENTRANCE, joining the two galleries so the upper circuit
          closes — a gallery you have to walk back down is a dead end, not a
          floor. It was over the window end first, and from the middle of
          the nave it cut a pale bar straight across the great window, which
          is the one view in the building worth protecting. Behind the
          customer it does the same structural job and blocks nothing. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, B.gallery.y, B.nave.front - 3.1]}
        receiveShadow
        material={m.stone}
      >
        <planeGeometry args={[B.arcade.x * 2, 3.0]} />
      </mesh>
      <mesh position={[0, B.gallery.y - 0.15, B.nave.front - 4.6]} material={m.stone} castShadow>
        <boxGeometry args={[B.arcade.x * 2, 0.3, 0.3]} />
      </mesh>
      {/* its balustrade, so the gallery is railed all the way round */}
      {Array.from({ length: 12 }, (_, i) => -B.arcade.x + 0.4 + i * 1.1).map((x) => (
        <mesh
          key={x}
          position={[x, B.gallery.y + B.gallery.rail / 2, B.nave.front - 4.65]}
          material={m.gold}
          castShadow
        >
          <cylinderGeometry args={[0.022, 0.022, B.gallery.rail, 8]} />
        </mesh>
      ))}
      <mesh
        position={[0, B.gallery.y + B.gallery.rail, B.nave.front - 4.65]}
        rotation-z={Math.PI / 2}
        material={m.gold}
        castShadow
      >
        <cylinderGeometry args={[0.045, 0.045, B.arcade.x * 2, 12]} />
      </mesh>

      {/* ══ the balustrade ═══════════════════════════════════════
          Gold uprights with a gold handrail. This is the board's gold doing
          its proper job: a metal object catching the light, dull in the
          shade of the gallery and bright where a sconce reaches it. */}
      {[-1, 1].map((side) =>
        Array.from({ length: 30 }, (_, i) => B.nave.back + 1.2 + i * 1.1).map((z) => (
          <mesh
            key={`${side}-${z}`}
            position={[side * (B.arcade.x - 0.18), B.gallery.y + B.gallery.rail / 2, z]}
            material={m.gold}
            castShadow
          >
            <cylinderGeometry args={[0.022, 0.022, B.gallery.rail, 8]} />
          </mesh>
        )),
      )}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (B.arcade.x - 0.18), B.gallery.y + B.gallery.rail, aisleMid]}
          rotation-x={Math.PI / 2}
          material={m.gold}
          castShadow
        >
          <cylinderGeometry args={[0.045, 0.045, aisleLength, 12]} />
        </mesh>
      ))}

      {/* ══ the stair ════════════════════════════════════════════ */}
      <group position={[B.stair.x, 0, 0]}>
        {stair.map((s) => (
          <mesh key={s.z} position={[0, s.y, s.z]} material={m.marbleLight} castShadow receiveShadow>
            <boxGeometry args={[B.stair.width, s.h, s.d]} />
          </mesh>
        ))}
        {/* a gold handrail following the flight */}
        <mesh
          position={[
            B.stair.width / 2 - 0.08,
            B.gallery.y / 2 + 0.95,
            (B.stair.bottomZ + B.stair.topZ) / 2,
          ]}
          rotation-x={Math.atan2(B.gallery.y, B.stair.bottomZ - B.stair.topZ)}
          material={m.gold}
          castShadow
        >
          <cylinderGeometry
            args={[0.04, 0.04, Math.hypot(B.gallery.y, B.stair.bottomZ - B.stair.topZ), 10]}
          />
        </mesh>
      </group>

      {/* ══ the great window wall ════════════════════════════════ */}
      <mesh
        geometry={endWall}
        position={[0, 0, B.endWall.z - B.endWall.thickness]}
        material={m.stone}
        castShadow
        receiveShadow
      />
      {B.windows.map((w) => (
        <mesh
          key={w.cx}
          position={[w.cx, w.sill - 0.06, B.endWall.z - 0.3]}
          material={m.stone}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w.width + 0.5, 0.12, 1.0]} />
        </mesh>
      ))}

      {/* ══ the vault ════════════════════════════════════════════ */}
      {B.bays.map((z) => (
        <mesh key={z} geometry={band} position={[0, B.springline, z]} material={m.stone} castShadow receiveShadow />
      ))}
      <mesh rotation-x={Math.PI / 2} position={[0, B.nave.height, naveMid]} material={m.plaster}>
        <planeGeometry args={[B.arcade.x * 2, naveLength]} />
      </mesh>
      {quality === "high" &&
        Array.from({ length: 24 }, (_, i) => B.nave.back + 1 + i * 1.5).map((z) => (
          <mesh key={z} position={[0, B.nave.height - 0.22, z]} material={m.timber} castShadow>
            <boxGeometry args={[B.arcade.x * 2, 0.44, 0.26]} />
          </mesh>
        ))}

      {/* ══ outer walls ══════════════════════════════════════════ */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * B.aisle.x, B.nave.height / 2, aisleMid]}
          rotation-y={-side * (Math.PI / 2)}
          material={m.sand}
          receiveShadow
        >
          <planeGeometry args={[aisleLength, B.nave.height]} />
        </mesh>
      ))}
      {/* the gallery's own ceiling, over the aisles */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation-x={Math.PI / 2}
          position={[side * ((B.arcade.x + B.aisle.x) / 2), B.gallery.y + B.gallery.height, aisleMid]}
          material={m.sand}
        >
          <planeGeometry args={[aisleWidth, aisleLength]} />
        </mesh>
      ))}

      {/* ══ the lobby, between the street doors and the hall ═════
          Lower and darker than the nave on purpose. Compressing the ceiling
          at the entrance is the oldest trick a cathedral has: the hall
          beyond reads as twice its own height because you came through
          something small to reach it. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * B.arcade.x, 4.4, (B.vestibule.front + B.nave.front) / 2]}
          rotation-y={-side * (Math.PI / 2)}
          material={m.plaster}
          receiveShadow
        >
          <planeGeometry args={[B.vestibule.front - B.nave.front, 8.8]} />
        </mesh>
      ))}
      <mesh
        rotation-x={Math.PI / 2}
        position={[0, 8.8, (B.vestibule.front + B.nave.front) / 2]}
        material={m.plaster}
      >
        <planeGeometry args={[B.arcade.x * 2, B.vestibule.front - B.nave.front]} />
      </mesh>

      {/* the inner arch, from the lobby into the hall */}
      <mesh
        geometry={useMemo(
          () =>
            pierceWall(B.arcade.x * 2, B.nave.height, 0.6, [
              archPath(0, 6.2, 9.4, 0),
            ]),
          [],
        )}
        position={[0, 0, B.nave.front]}
        material={m.stone}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/**
 * The doors.
 *
 * Two leaves of glass in a bronze frame, hung on the jambs of the entrance
 * arch. They are SHUT when the customer arrives and they swing when the
 * customer comes in, because the single most important second of a shop is
 * the one where the door gives — it is the moment you stop being outside.
 *
 * The swing is eased, not linear, and the two leaves are offset by 80 ms:
 * a real pair of doors pushed by one person never opens in perfect unison,
 * and that tiny imperfection is most of what sells it.
 */
export function Doors({ m, open }: { m: Materials; open: boolean }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current = THREE.MathUtils.clamp(t.current + (open ? dt : -dt) * 0.55, 0, 1);
    const ease = (v: number) => (v < 0.5 ? 4 * v ** 3 : 1 - Math.pow(-2 * v + 2, 3) / 2);
    const a = ease(t.current);
    const b = ease(THREE.MathUtils.clamp((t.current - 0.09) / 0.91, 0, 1));
    if (left.current) left.current.rotation.y = a * 1.42;
    if (right.current) right.current.rotation.y = -b * 1.42;
  });

  const leaf = (
    <>
      <mesh position={[B.doors.leaf / 2, B.doors.height / 2 - 0.4, 0]} material={m.glass}>
        <boxGeometry args={[B.doors.leaf - 0.14, B.doors.height - 1.0, 0.03]} />
      </mesh>
      {/* the frame */}
      <mesh position={[B.doors.leaf / 2, B.doors.height / 2 - 0.4, 0]} material={m.goldDark}>
        <boxGeometry args={[B.doors.leaf, B.doors.height - 0.8, 0.06]} />
      </mesh>
      <mesh position={[B.doors.leaf / 2, B.doors.height / 2 - 0.4, 0.001]} material={m.glass}>
        <boxGeometry args={[B.doors.leaf - 0.16, B.doors.height - 1.0, 0.07]} />
      </mesh>
      {/* the handle — a long vertical bar in champagne gold */}
      <mesh position={[B.doors.leaf - 0.22, 1.05, 0.08]} material={m.gold} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 1.1, 10]} />
      </mesh>
    </>
  );

  return (
    <group position={[0, 0, B.doors.z]}>
      <group ref={left} position={[-B.doors.width / 2, 0, 0]}>{leaf}</group>
      <group ref={right} position={[B.doors.width / 2, 0, 0]} scale={[-1, 1, 1]}>{leaf}</group>
    </group>
  );
}
