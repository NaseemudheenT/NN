/**
 * NERO NOREN — architectural regression check.
 *
 * `npm run showroom:check`
 *
 * The building is code, which means a plausible-looking number can quietly
 * make it a worse building — a wall thinned until its arches have no
 * reveal, a vault that tops out above its own ceiling, a stair whose head
 * lands inside a wall, a zone the panel teleports to that nobody can stand
 * on. None of that shows up in a type error, and most of it does not show
 * up in a screenshot either, because you have to be standing in the right
 * place to see it.
 *
 * So this asserts what a drawing office would assert, against the one plan
 * every part of the building measures itself from. Every check here was
 * verified by breaking the value it guards and watching this fail.
 */

import * as THREE from "three";
import {
  B,
  BLOCKERS,
  EYE,
  FACADE,
  FITTING,
  FLOORS,
  PLINTHS,
  RAILS,
  SEATS,
  TABLE,
  TREES,
  ZONES,
  type Rect,
} from "../components/world/plan";
import { archBand, archPath, garmentShape, pierceWall } from "../components/showroom/geometry";
import { INTRO, INTRO_TOTAL, introShot } from "../components/world/intro";

let failures = 0;
const pass = (what: string, detail = "") => console.log(`  ok   ${what}${detail ? ` — ${detail}` : ""}`);
const fail = (what: string, detail: string) => {
  failures += 1;
  console.error(`  FAIL ${what} — ${detail}`);
};
const check = (what: string, ok: boolean, detail: string) => (ok ? pass(what, detail) : fail(what, detail));

const inRect = (x: number, z: number, r: Rect) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
const walkable = (x: number, z: number, floor: number) => FLOORS[floor].areas.some((a) => inRect(x, z, a));

console.log("\nNERO NOREN — building check\n");

/* ── 1. the masonry is thick enough to have a reveal ─────────────
   An arch cut through a 50 mm wall has a 50 mm soffit, which at any
   realistic angle is a line rather than a surface — and a lit surface at a
   grazing angle is the whole reason the arches read as masonry instead of
   as holes in card. 300 mm is the thinnest a real load-bearing arcade gets. */
console.log("masonry");
check("the great window wall reveals", B.endWall.thickness >= 0.3, `${(B.endWall.thickness * 1000).toFixed(0)} mm`);
check("the arcade reveals", B.arcade.thickness >= 0.3, `${(B.arcade.thickness * 1000).toFixed(0)} mm`);
check("the street facade reveals", FACADE.thickness >= 0.3, `${(FACADE.thickness * 1000).toFixed(0)} mm`);

/* ── 2. the arch soffit really IS the hole's own side wall ───────
   If ExtrudeGeometry ever stops generating the hole's wall, the arches
   become two parallel cut-out plates and the building loses its depth
   silently. The discriminator is not "vertices between the faces" — an
   extruded side wall is quads whose corners sit ON the two faces, so there
   is nothing in between. It is whether any TRIANGLE both lies on the arch's
   radius and SPANS the wall. Only a soffit does that. */
console.log("\narch soffit");
{
  const w = B.windows[0];
  const t = B.endWall.thickness;
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
  check("the soffit is generated, not drawn", spanning > 0,
    `${spanning} triangles span the ${(t * 1000).toFixed(0)} mm wall on the arch radius`);
}

/* ── 3. the vault fits under its own ceiling ─────────────────────
   Visible only from one end of the hall, which is exactly the kind of
   thing that ships. */
console.log("\nthe vault");
{
  const crown = B.springline + B.vaultRise + B.vaultBand;
  check("the vault clears the ceiling", crown <= B.nave.height, `crown ${crown.toFixed(2)} m, ceiling ${B.nave.height} m`);
  check("the vault springs above the arcade", B.springline >= B.arcade.openingHeight,
    `springline ${B.springline} m, arcade head ${B.arcade.openingHeight} m`);
  check("the gallery fits under the springline", B.gallery.y + B.gallery.rail < B.springline,
    `handrail at ${(B.gallery.y + B.gallery.rail).toFixed(2)} m`);
  check("the gallery's openings fit under the springing",
    B.gallery.y + 0.1 + B.arcade.upperHeight <= B.springline,
    `head at ${(B.gallery.y + 0.1 + B.arcade.upperHeight).toFixed(2)} m, springing ${B.springline} m`);
  const g = archBand(B.arcade.x * 2, B.vaultBand, 1.0, B.vaultRise);
  g.computeBoundingBox();
  check("the band's origin sits on the springline", Math.abs(g.boundingBox!.min.y) < 1e-6, "y = 0");
}

/* ── 4. the great window leaves a mullion between its lights ───── */
console.log("\nthe great window");
{
  const sorted = [...B.windows].sort((a, b) => a.cx - b.cx);
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = (sorted[i].cx - sorted[i].width / 2) - (sorted[i - 1].cx + sorted[i - 1].width / 2);
    check(`mullion between ${sorted[i - 1].cx} and ${sorted[i].cx}`, gap >= 0.6, `${(gap * 1000).toFixed(0)} mm`);
  }
  for (const w of B.windows) {
    check(`window at ${w.cx} fits the wall`, w.sill + w.height <= B.nave.height - 0.8,
      `head ${(w.sill + w.height).toFixed(2)} m of ${B.nave.height} m`);
    check(`window at ${w.cx} is round-headed`, w.height > w.width / 2, "straight jambs below the springing");
  }
}

/* ── 5. the arcade's openings fit between their piers ──────────── */
console.log("\nthe arcade");
{
  const bays = [...B.bays].sort((a, b) => a - b);
  for (let i = 1; i < bays.length; i += 1) {
    const gap = bays[i] - bays[i - 1] - B.arcade.openingWidth;
    check(`pier between bay ${i - 1} and ${i}`, gap >= 1.2, `${gap.toFixed(2)} m`);
  }
  check("the arcade stops short of the window wall",
    bays[0] - B.arcade.openingWidth / 2 - B.nave.back >= 1.0,
    `${(bays[0] - B.arcade.openingWidth / 2 - B.nave.back).toFixed(2)} m`);
}

/* ── 6. the stair actually connects the two floors ───────────────
   A stair whose foot is in the nave and whose head is in a wall is the
   single worst bug this plan can produce: the second floor simply cannot
   be reached on foot, and nothing says so. */
console.log("\nthe stair");
{
  const foot = { x: B.stair.x, z: B.stair.bottomZ + 0.6 };
  const head = { x: B.stair.x, z: B.stair.topZ - 0.6 };
  check("you can step onto it from the ground floor", walkable(foot.x, foot.z, 0), `foot at z ${foot.z.toFixed(1)}`);
  check("you can step off it into the gallery", walkable(head.x, head.z, 1), `head at z ${head.z.toFixed(1)}`);
  const rise = B.gallery.y / B.stair.steps;
  const run = (B.stair.bottomZ - B.stair.topZ) / B.stair.steps;
  check("the going is climbable", rise <= 0.2 && run >= 0.26,
    `${(rise * 1000).toFixed(0)} mm rise, ${(run * 1000).toFixed(0)} mm going`);
  check("the stair is wide enough for two", B.stair.width >= 1.6, `${B.stair.width} m`);
  check("it is inside the west aisle", B.stair.x - B.stair.width / 2 > -B.aisle.x && B.stair.x + B.stair.width / 2 < -B.arcade.x,
    `x ${(B.stair.x - B.stair.width / 2).toFixed(2)} to ${(B.stair.x + B.stair.width / 2).toFixed(2)}`);
}

/* ── 7. every zone is a place a person can actually be ───────────
   The panel teleports to these. A zone outside the walkable area, or
   standing inside a plinth, drops the customer into a wall. */
console.log("\nthe zones");
for (const z of ZONES) {
  const [x, zz] = z.at;
  const onFloor = walkable(x, zz, z.floor) ||
    (x > B.stair.x - B.stair.width / 2 && x < B.stair.x + B.stair.width / 2 && zz > B.stair.topZ && zz < B.stair.bottomZ);
  check(`${z.label} is somewhere you can stand`, onFloor, `(${x}, ${zz}) on floor ${z.floor}`);

  const clash = BLOCKERS.find(
    (b) => b.floor === z.floor && Math.hypot(b.x - x, b.z - zz) < b.r + 0.42,
  );
  check(`${z.label} is not inside the furniture`, !clash,
    clash ? `inside a blocker at (${clash.x}, ${clash.z})` : "clear");
}

/* ── 8. nothing in the building stands inside anything else ────── */
console.log("\nclearance");
{
  type Item = { what: string; x: number; z: number; r: number; floor: number };
  const items: Item[] = [
    ...RAILS.map((r) => ({ what: `rail ${r.id}`, x: r.x, z: r.z, r: Math.max(0.42, r.length / 2), floor: r.floor })),
    ...TREES.map((t, i) => ({ what: `tree ${i}`, x: t.x, z: t.z, r: 0.9 * t.scale, floor: 0 })),
    ...PLINTHS.map((p, i) => ({ what: `plinth ${i}`, x: p.x, z: p.z, r: 0.6, floor: p.floor })),
    ...SEATS.map((s, i) => ({ what: `seat ${i}`, x: s.x, z: s.z, r: 0.6, floor: 0 })),
    { what: "table", x: TABLE.x, z: TABLE.z, r: Math.hypot(TABLE.width, TABLE.depth) / 2, floor: 0 },
  ];

  let worst = Infinity;
  let pair = "";
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i], b = items[j];
      if (a.floor !== b.floor) continue;
      const clear = Math.hypot(a.x - b.x, a.z - b.z) - a.r - b.r;
      if (clear < worst) { worst = clear; pair = `${a.what} / ${b.what}`; }
    }
  }
  check("nothing overlaps on the plan", worst > 0, `closest ${pair} at ${worst.toFixed(2)} m`);

  /* The centre of the nave stays walkable, as far as the dais — which is
     where the walk ENDS. The table standing on the axis under the great
     window is the plan, not an obstruction: a basilica terminating in
     something is the whole idea. */
  const WALK = 1.3;
  const daisEdge = B.nave.back + 3.4;
  const blocking = items.filter((it) => it.floor === 0 && Math.abs(it.x) - it.r < WALK && it.z > daisEdge && it.z < B.nave.front);
  check("the centre of the nave is walkable", blocking.length === 0,
    blocking.length ? blocking.map((b) => b.what).join(", ") : `${WALK * 2} m clear from the hall door to the dais`);

  check("the fitting alcove is off the east aisle", FITTING.x >= B.aisle.x,
    `recessed at x ${FITTING.x}`);
}

/* ── 9. the arrival never flies through the building ─────────────
   The one shot that has to be beautiful. A camera that clips the facade,
   or dives under the pavement, ruins it — and both are a one-character
   change away at all times. */
console.log("\nthe arrival");
{
  let lowest = Infinity;
  let insideCount = 0;
  let backwards = 0;
  let lastZ = Infinity;
  const shot = introShot(0);

  for (let t = 0; t <= INTRO_TOTAL; t += 0.05) {
    introShot(t, shot);
    lowest = Math.min(lowest, shot.position.y);
    /* "inside the building" = behind the facade but not yet through the
       door opening, horizontally or vertically */
    const behind = shot.position.z < FACADE.z + FACADE.thickness;
    const throughDoor =
      Math.abs(shot.position.x) < B.doors.width / 2 && shot.position.y < B.doors.height;
    if (behind && !throughDoor) insideCount += 1;
    if (t > INTRO.orbit && shot.position.z > lastZ + 0.01) backwards += 1;
    lastZ = shot.position.z;
  }

  check("the camera stays above the pavement", lowest > 0.6, `lowest ${lowest.toFixed(2)} m`);
  check("the camera never clips the facade", insideCount === 0,
    insideCount ? `${insideCount} samples inside the masonry` : "it goes through the door or not at all");
  check("the approach never backs up", backwards === 0, `${backwards} samples moving away`);

  const landing = introShot(INTRO_TOTAL);
  check("it lands at eye height", Math.abs(landing.position.y - EYE) < 0.05, `${landing.position.y.toFixed(2)} m`);
  check("it lands somewhere you can stand",
    walkable(landing.position.x, landing.position.z, 0),
    `(${landing.position.x.toFixed(1)}, ${landing.position.z.toFixed(1)})`);
  check("it lands facing the hall", landing.target.z < landing.position.z, "looking down the nave");
}

/* ── 10. a garment is a garment ──────────────────────────────── */
console.log("\nthe stock");
{
  const g = garmentShape(1.16, 0.52, 0.6);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  check("it hangs down from the hanger", bb.max.y <= 0.08 && bb.min.y < -1,
    `y ${bb.min.y.toFixed(2)} to ${bb.max.y.toFixed(2)}`);
  check("it has a front and a back", bb.max.z - bb.min.z > 0.08, `${((bb.max.z - bb.min.z) * 1000).toFixed(0)} mm deep`);
  check("it is taller than it is wide", bb.max.y - bb.min.y > bb.max.x - bb.min.x, `${(bb.max.y - bb.min.y).toFixed(2)} m`);
  check("every rail carries stock for somebody", RAILS.every((r) => r.audience === "men" || r.audience === "boys"),
    `${RAILS.filter((r) => r.audience === "boys").length} in the gallery, ${RAILS.filter((r) => r.audience === "men").length} below`);
}

console.log(
  failures === 0 ? "\nThe building stands.\n" : `\n${failures} check${failures === 1 ? "" : "s"} failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);

void THREE;
