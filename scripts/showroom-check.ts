/**
 * NERO NOREN — architectural regression check.
 *
 * `npm run showroom:check`
 *
 * The hall is code, which means a plausible-looking number can quietly make
 * it a worse building — a wall thinned until its arches have no reveal, a
 * vault that tops out above its own ceiling, a rail standing inside a tree.
 * None of that shows up in a type error and some of it does not show up in a
 * screenshot either, because you have to be standing in the right place.
 *
 * So this asserts the things a drawing office would check, against the one
 * plan every part of the room measures itself from. It has teeth: each
 * assertion was verified by breaking the value it guards and watching this
 * fail.
 */

import * as THREE from "three";
import { PLAN } from "../components/showroom/plan";
import { archBand, archPath, garmentShape, pierceWall } from "../components/showroom/geometry";

let failures = 0;
const pass = (what: string, detail = "") => console.log(`  ok   ${what}${detail ? ` — ${detail}` : ""}`);
const fail = (what: string, detail: string) => {
  failures += 1;
  console.error(`  FAIL ${what} — ${detail}`);
};
const check = (what: string, ok: boolean, detail: string) => (ok ? pass(what, detail) : fail(what, detail));

console.log("\nNERO NOREN — showroom check\n");

/* ── 1. the masonry is thick enough to have a reveal ─────────────
   An arch cut through a 50 mm wall has a 50 mm soffit, which at any
   realistic viewing angle is a line rather than a surface — and a surface
   catching light at a grazing angle is the whole reason the arches read as
   masonry instead of as holes in card. 300 mm is the thinnest a real
   load-bearing arcade gets. */
console.log("masonry");
check(
  "the end wall is thick enough to reveal",
  PLAN.endWall.thickness >= 0.3,
  `${(PLAN.endWall.thickness * 1000).toFixed(0)} mm`,
);
check(
  "the arcade is thick enough to reveal",
  PLAN.arcade.thickness >= 0.3,
  `${(PLAN.arcade.thickness * 1000).toFixed(0)} mm`,
);

/* ── 2. the arch soffit really is the hole's own side wall ───────
   If ExtrudeGeometry ever stops generating the hole's wall, the arches
   become two parallel cut-out plates and the room loses its depth silently —
   a change you cannot see from the front and cannot see in a type error.

   The discriminator is NOT "vertices between the faces": an extruded side
   wall is quads whose corners sit ON the two faces, so there is nothing in
   between. It is whether any TRIANGLE both lies on the arch's radius and
   SPANS the wall — front face to back face. Only a soffit does that. */
console.log("\narch soffit");
{
  const w = PLAN.windows[0];
  const t = PLAN.endWall.thickness;
  const geo = pierceWall(8, 14, t, [archPath(0, w.width, w.height, w.sill)]);
  const pos = geo.attributes.position;
  const r = w.width / 2;
  const springY = w.sill + w.height - r;

  let spanning = 0;
  for (let i = 0; i < pos.count; i += 3) {
    let onCurve = true;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let k = 0; k < 3; k += 1) {
      const x = pos.getX(i + k), y = pos.getY(i + k), z = pos.getZ(i + k);
      if (y < springY || Math.abs(Math.hypot(x, y - springY) - r) > 0.02) { onCurve = false; break; }
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    if (onCurve && maxZ - minZ > t * 0.9) spanning += 1;
  }
  check("the soffit is generated, not drawn", spanning > 0, `${spanning} triangles span the ${(t * 1000).toFixed(0)} mm wall on the arch radius`);
}

/* ── 3. the vault fits under its own ceiling ─────────────────────
   The transverse arch springs from PLAN.springline and rises by half the
   nave's width plus the band. If that total passes the ceiling the arches
   punch through the roof — visible only from one end of the hall, which is
   exactly the kind of thing that ships. */
console.log("\nthe vault");
{
  const band = 0.55;
  const top = PLAN.springline + PLAN.arcade.x + band;
  check("the vault clears the ceiling", top <= PLAN.nave.height, `crown ${top.toFixed(2)} m, ceiling ${PLAN.nave.height} m`);
  check(
    "the vault springs above the arcade",
    PLAN.springline >= PLAN.arcade.openingHeight,
    `springline ${PLAN.springline} m, arcade head ${PLAN.arcade.openingHeight} m`,
  );
  const g = archBand(PLAN.arcade.x * 2, band, 1.0);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  check("the band's origin sits on the springline", Math.abs(bb.min.y) < 1e-6, `min y ${bb.min.y.toFixed(4)}`);
}

/* ── 4. the windows leave a mullion between them ─────────────────
   Two arches 200 mm apart is not a pair of windows, it is one window with a
   crack in it, and the masonry between would not stand up. */
console.log("\nthe great window");
{
  const sorted = [...PLAN.windows].sort((a, b) => a.cx - b.cx);
  for (let i = 1; i < sorted.length; i += 1) {
    const left = sorted[i - 1], right = sorted[i];
    const gap = (right.cx - right.width / 2) - (left.cx + left.width / 2);
    check(`mullion between ${left.cx} and ${right.cx}`, gap >= 0.6, `${(gap * 1000).toFixed(0)} mm`);
  }
  for (const w of PLAN.windows) {
    check(
      `window at ${w.cx} fits the wall`,
      w.sill + w.height <= PLAN.nave.height - 0.8,
      `head ${(w.sill + w.height).toFixed(2)} m of ${PLAN.nave.height} m`,
    );
    check(`window at ${w.cx} is round-headed`, w.height > w.width / 2, "straight jambs below the springing");
  }
}

/* ── 5. the arcade's openings fit between their piers ────────────
   Bays are placed by centre, so an opening that grew wider than its bay eats
   the pier beside it and the arcade becomes a colonnade of thin air. */
console.log("\nthe arcade");
{
  const bays = [...PLAN.bays].sort((a, b) => a - b);
  for (let i = 1; i < bays.length; i += 1) {
    const gap = bays[i] - bays[i - 1] - PLAN.arcade.openingWidth;
    check(`pier between bay ${i - 1} and ${i}`, gap >= 1.2, `${gap.toFixed(2)} m`);
  }
  const first = bays[0] - PLAN.arcade.openingWidth / 2 - PLAN.nave.back;
  const last = PLAN.nave.front - (bays[bays.length - 1] + PLAN.arcade.openingWidth / 2);
  check("the arcade stops short of the end wall", first >= 1.0, `${first.toFixed(2)} m`);
  check("the arcade stops short of the entrance", last >= 1.0, `${last.toFixed(2)} m`);
}

/* ── 6. nothing in the room stands inside anything else ──────────
   Checked as circles on the plan, which is how a floor plan is read. */
console.log("\nclearance");
{
  type Item = { what: string; x: number; z: number; r: number };
  const items: Item[] = [
    ...PLAN.rails.map((r, i) => ({ what: `rail ${i}`, x: r.x, z: r.z, r: Math.max(0.42, r.length / 2) })),
    ...PLAN.trees.map((t, i) => ({ what: `tree ${i}`, x: t.x, z: t.z, r: 0.85 * t.scale })),
    ...PLAN.mannequins.map((m, i) => ({ what: `mannequin ${i}`, x: m.x, z: m.z, r: 0.5 })),
    ...PLAN.chairs.map((c, i) => ({ what: `chair ${i}`, x: c.x, z: c.z, r: 0.55 })),
    { what: "table", x: PLAN.table.x, z: PLAN.table.z, r: Math.hypot(PLAN.table.width, PLAN.table.depth) / 2 },
  ];

  let worst = Infinity;
  let worstPair = "";
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i], b = items[j];
      const clear = Math.hypot(a.x - b.x, a.z - b.z) - a.r - b.r;
      if (clear < worst) { worst = clear; worstPair = `${a.what} / ${b.what}`; }
    }
  }
  check("nothing overlaps on the plan", worst > 0, `closest ${worstPair} at ${worst.toFixed(2)} m`);

  /* The walking line down the middle of the nave stays clear — as far as the
     dais, which is where the walk ENDS. The presentation table stands on the
     dais under the great window on purpose: it is the thing you walk toward,
     and a basilica's axis terminating in an altar is the whole plan. Treating
     it as an obstruction would be reading the drawing backwards. */
  const WALK = 1.4;
  const daisEdge = PLAN.endWall.z + 3.2;
  const blocking = items.filter(
    (it) => Math.abs(it.x) - it.r < WALK && it.z < PLAN.nave.front && it.z > daisEdge,
  );
  check("the centre of the nave is walkable", blocking.length === 0,
    blocking.length ? blocking.map((b) => b.what).join(", ") : `${WALK * 2} m clear from the entrance to the dais`);

  /* And the dais is deep enough to hold what stands on it. */
  const tableBack = PLAN.table.z - PLAN.table.depth / 2;
  check("the table stands on the dais", tableBack > PLAN.endWall.z && PLAN.table.z < daisEdge,
    `table at z ${PLAN.table.z}, dais ends at ${daisEdge.toFixed(1)}`);

  /* Rails and trees stand inside the building. */
  const outside = items.filter((it) => Math.abs(it.x) + it.r > PLAN.aisle.x);
  check("everything is inside the walls", outside.length === 0,
    outside.length ? outside.map((o) => o.what).join(", ") : `within ±${PLAN.aisle.x} m`);
}

/* ── 7. the camera is standing in the room, at eye height ────────── */
console.log("\nthe camera");
{
  const [cx, cy, cz] = PLAN.camera.position;
  const [, ty, tz] = PLAN.camera.target;
  check("eye height is human", cy > 1.4 && cy < 1.95, `${cy} m`);
  check("the camera is inside the hall", Math.abs(cx) < PLAN.arcade.x && cz <= PLAN.nave.front, `(${cx}, ${cz})`);
  check("it is looking up the nave at the window", tz < cz && ty > cy, `target z ${tz}, y ${ty}`);
  check("the field of view is architectural, not fish-eye", PLAN.camera.fov <= 50, `${PLAN.camera.fov}°`);
}

/* ── 8. a garment is a garment ───────────────────────────────────── */
console.log("\nthe stock");
{
  const g = garmentShape(1.16, 0.52, 0.6);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const h = bb.max.y - bb.min.y;
  const d = bb.max.z - bb.min.z;
  check("it hangs down from the hanger", bb.max.y <= 0.08 && bb.min.y < -1, `y ${bb.min.y.toFixed(2)} to ${bb.max.y.toFixed(2)}`);
  check("it has a front and a back", d > 0.08, `${(d * 1000).toFixed(0)} mm deep`);
  check("it is taller than it is wide", h > bb.max.x - bb.min.x, `${h.toFixed(2)} m tall`);
}

console.log(
  failures === 0
    ? "\nThe building stands.\n"
    : `\n${failures} check${failures === 1 ? "" : "s"} failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);

/* keep the import used so tree-shaking in a bundler cannot drop it */
void THREE;
