/**
 * Is the showroom actually built, and does the camera stay out of it?
 *
 * Checks every fixed viewpoint, every station of the homepage walk, and every
 * routed path between them against the floor plan. A camera placed inside a
 * dressed mannequin is the kind of defect that is invisible in code review,
 * obvious the moment someone scrolls, and trivially catchable here.
 *
 * Two things, both of them the kind of defect that is invisible in code
 * review and obvious the moment someone scrolls.
 *
 * THE CAMERA. Every fixed viewpoint, every station of the homepage walk, and
 * every routed path between them, against the floor plan. A camera placed
 * inside a dressed mannequin is trivially catchable here and nowhere else.
 *
 * THE ARCHITECTURE. The arcade's piers, the rails fitting their openings, the
 * beam angles against the brief's 15°–24°, whether the cove strips are
 * genuinely hidden from eye height, and whether the windows are genuinely
 * deep-set. Each of these is a number someone could "tidy" later without
 * realising it was load-bearing — the spots were a 39° flood before this
 * check existed, which is nearly twice the brief and lit the walkways as
 * brightly as the merchandise.
 *
 *   npm run showroom:check
 */

import {
  CLEARANCE,
  FLOOR_PLAN,
  clearanceAt,
  curveBetween,
  routeBetween,
  moveDuration,
  sweepBetween,
  wallClearance,
  WALL_MARGIN,
} from "../components/showroom/choreography";
import { VIEWPOINTS, INTRO } from "../components/showroom/viewpoints";
import { HOME_WALK } from "../components/showroom/ScrollCamera";
import { ARCADE, ARCADE_BAYS, ROOM, WINDOW } from "../components/showroom/objects/Room";
import { MASONRY } from "../components/showroom/objects/Masonry";
import * as THREE from "three";

let failures = 0;
const note = (s: string) => console.log(s);
const fail = (s: string) => {
  failures += 1;
  console.log(`  FAIL  ${s}`);
};

/** A camera standing still may be closer to things than one walking past. */
const STANDING_CLEARANCE = 0.3;

/* Numbers the scene holds privately, restated here so a change to either
   side shows up as a failure rather than as a silent disagreement. */
const BEAM_ANGLES = { narrow: 0.148, medium: 0.209 };
const COVE_LIP = { proud: 0.12, rise: 0.18 };
const COVE_Y = ROOM.height - 0.34;
/** [x, length] of each garment rail, from Scene.tsx. */
const RAILS: [number, number][] = [
  [-3.3, 1.4],
  [-1.0, 1.4],
];

/** Outside the portal, on the approach. The entry shots start out here. */
function outdoors(p: readonly [number, number, number]): boolean {
  return p[0] < -ROOM.halfW;
}

function checkStandpoint(label: string, p: readonly [number, number, number]) {
  const { distance, obstacle } = clearanceAt(p[0], p[2]);
  const wall = wallClearance(p[0], p[2]);
  const where = `(${p[0].toFixed(2)}, ${p[2].toFixed(2)})`;

  if (outdoors(p)) {
    // The approach deliberately stands outside the building looking in, so
    // the walls do not apply — but it does have to be in front of the door.
    if (Math.abs(p[2]) > 1.1) {
      fail(`${label} ${where} is outside the portal but off its axis`);
    } else {
      note(`  ok    ${label.padEnd(24)} ${where.padEnd(16)} outside, on the portal axis`);
    }
    return;
  }

  if (distance < STANDING_CLEARANCE) {
    fail(
      `${label} ${where} is ${distance.toFixed(2)} m from ${obstacle?.id} ` +
        `— needs ${STANDING_CLEARANCE} m${distance < 0 ? " (INSIDE IT)" : ""}`,
    );
  } else if (wall < WALL_MARGIN - 0.1) {
    fail(`${label} ${where} is ${wall.toFixed(2)} m from a wall`);
  } else {
    note(
      `  ok    ${label.padEnd(24)} ${where.padEnd(16)} ` +
        `${distance.toFixed(2)} m to ${obstacle?.id ?? "nothing"}`,
    );
  }
}

note("\nFLOOR PLAN");
for (const o of FLOOR_PLAN) {
  note(
    `        ${o.id.padEnd(14)} at (${o.x.toFixed(2)}, ${o.z.toFixed(2)})  ` +
      `${(o.hx * 2).toFixed(2)} × ${(o.hz * 2).toFixed(2)} m + ${o.pad} m skirt, ` +
      `${o.height.toFixed(2)} m tall`,
  );
}

note("\nWHERE THE CAMERA STANDS");
for (const v of VIEWPOINTS) checkStandpoint(`viewpoint:${v.id}`, v.position);
for (const s of HOME_WALK) checkStandpoint(`walk:${s.id}`, s.position);

note("\nHOW IT GETS THERE  (routed, 41 samples each)");
for (let i = 0; i < VIEWPOINTS.length; i += 1) {
  for (let j = 0; j < VIEWPOINTS.length; j += 1) {
    if (i === j) continue;
    const from = VIEWPOINTS[i];
    const to = VIEWPOINTS[j];

    // the straight line this replaces, for comparison
    let straightWorst = Infinity;
    let straightHit = "";
    for (let k = 0; k <= 40; k += 1) {
      const t = k / 40;
      const x = from.position[0] + (to.position[0] - from.position[0]) * t;
      const z = from.position[2] + (to.position[2] - from.position[2]) * t;
      const c = clearanceAt(x, z);
      if (c.distance < straightWorst) {
        straightWorst = c.distance;
        straightHit = c.obstacle?.id ?? "";
      }
    }

    const curve = curveBetween(from.position, to.position);
    let worst = Infinity;
    let hit = "";
    for (let k = 0; k <= 40; k += 1) {
      const p = curve.getPointAt(k / 40);
      const c = clearanceAt(p.x, p.z);
      if (c.distance < worst) {
        worst = c.distance;
        hit = c.obstacle?.id ?? "";
      }
    }

    const sweep = sweepBetween(from.position, from.target, to.position, to.target);
    const secs = moveDuration(curve.getLength(), sweep);
    const leg = `${from.id} → ${to.id}`;

    // Endpoints are pinned, so a path can be no better than its worse end.
    const floor = Math.min(
      STANDING_CLEARANCE,
      clearanceAt(from.position[0], from.position[2]).distance,
      clearanceAt(to.position[0], to.position[2]).distance,
    );

    if (worst < floor - 0.01) {
      fail(`${leg} comes ${worst.toFixed(2)} m from ${hit}`);
    } else {
      const rescued =
        straightWorst < CLEARANCE && worst >= floor - 0.01
          ? `  (straight line: ${straightWorst.toFixed(2)} m from ${straightHit})`
          : "";
      note(
        `  ok    ${leg.padEnd(26)} ${curve.getLength().toFixed(1)} m  ` +
          `${((sweep * 180) / Math.PI).toFixed(0).padStart(3)}°  ` +
          `${secs.toFixed(2)}s  clears ${worst.toFixed(2)} m${rescued}`,
      );
    }
  }
}

/* The homepage walk, as the spline the camera is actually dragged along —
   not as the stations. The legs are routed clear, but they are then joined
   into one Catmull-Rom, and a spline smoothing through a waypoint can cut a
   corner the routing had carefully taken. This is the only check that proves
   what the visitor gets. */
note("\nTHE HOMEPAGE WALK  (the joined spline, 400 samples)");
{
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < HOME_WALK.length - 1; i += 1) {
    const leg = routeBetween(HOME_WALK[i].position, HOME_WALK[i + 1].position);
    points.push(...(i === 0 ? leg : leg.slice(1)));
  }
  const walk = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);

  let worst = Infinity;
  let hit = "";
  let at = 0;
  for (let k = 0; k <= 400; k += 1) {
    const t = k / 400;
    const p = walk.getPointAt(t);
    if (p.x < -ROOM.halfW) continue; // still outside, on the approach
    const c = clearanceAt(p.x, p.z);
    if (c.distance < worst) {
      worst = c.distance;
      hit = c.obstacle?.id ?? "";
      at = t;
    }
  }

  const floor = Math.min(
    STANDING_CLEARANCE,
    ...HOME_WALK.filter((s) => !outdoors(s.position)).map(
      (s) => clearanceAt(s.position[0], s.position[2]).distance,
    ),
  );

  if (worst < floor - 0.01) {
    fail(
      `the walk comes ${worst.toFixed(2)} m from ${hit} at ${(at * 100).toFixed(0)}% ` +
        `along${worst < 0 ? " (INSIDE IT)" : ""}`,
    );
  } else {
    note(
      `  ok    ${walk.getLength().toFixed(1)} m of floor, ` +
        `nearest approach ${worst.toFixed(2)} m to ${hit} at ${(at * 100).toFixed(0)}%`,
    );
  }
}

/* And the one-time entry push on the showroom page. */
note("\nTHE ENTRY PUSH");
{
  const curve = curveBetween(INTRO.from.position, INTRO.to.position);
  let worst = Infinity;
  let hit = "";
  for (let k = 0; k <= 120; k += 1) {
    const p = curve.getPointAt(k / 120);
    if (p.x < -ROOM.halfW) continue;
    const c = clearanceAt(p.x, p.z);
    if (c.distance < worst) {
      worst = c.distance;
      hit = c.obstacle?.id ?? "";
    }
  }
  if (worst < STANDING_CLEARANCE - 0.01) {
    fail(`the entry push comes ${worst.toFixed(2)} m from ${hit}`);
  } else {
    note(
      `  ok    ${curve.getLength().toFixed(1)} m, ${INTRO.duration}s, ` +
        `clears ${worst.toFixed(2)} m to ${hit}`,
    );
  }
}

/* ══ THE ARCHITECTURE ═════════════════════════════════════════════ */

note("\nTHE ARCADE");
{
  const piers: [number, number][] = [];
  let cursor = -ROOM.halfW;
  for (const bay of [...ARCADE_BAYS].sort((a, b) => a.x - b.x)) {
    const left = bay.x - bay.width / 2 - ARCADE.ring;
    const right = bay.x + bay.width / 2 + ARCADE.ring;
    if (left > cursor + 0.01) piers.push([cursor, left]);
    cursor = Math.max(cursor, right);
    const crown = ARCADE.springing + bay.width / 2;
    // Romanesque means the rise is exactly half the span. Not a style note:
    // it is the definition, and it is what makes these read as heavy.
    const rise = bay.width / 2;
    const romanesque = Math.abs(crown - ARCADE.springing - rise) < 1e-9;
    if (!romanesque) fail(`bay x=${bay.x} is not a true semicircle`);
    if (crown + ARCADE.ring > ROOM.height - 0.3) {
      fail(`bay x=${bay.x} crowns at ${crown.toFixed(2)} m — no room for a spandrel`);
    } else {
      note(
        `  ok    bay x=${bay.x.toFixed(2).padStart(5)}  opening ${bay.width.toFixed(2)} m  ` +
          `crown ${crown.toFixed(2)} m  spandrel ${(ROOM.height - crown - ARCADE.ring).toFixed(2)} m  ${bay.clay}`,
      );
    }
  }
  if (cursor < ROOM.halfW - 0.01) piers.push([cursor, ROOM.halfW]);

  /* A pier thinner than 300 mm stops reading as structure and starts
     reading as a mullion, at which point the wall is a partition with
     holes in it again and the whole exercise is undone. */
  const MIN_PIER = 0.3;
  for (const [a, b] of piers) {
    const w = b - a;
    if (w < MIN_PIER) {
      fail(`pier ${a.toFixed(2)}..${b.toFixed(2)} is only ${w.toFixed(2)} m — reads as a mullion`);
    } else {
      note(`  ok    pier ${a.toFixed(2).padStart(5)}..${b.toFixed(2).padStart(5)}  ${w.toFixed(2)} m solid`);
    }
  }
}

note("\nDO THE RAILS FIT THEIR OPENINGS?");
for (const [x, len] of RAILS) {
  const bay = ARCADE_BAYS.find((b) => Math.abs(b.x - x) < 0.01);
  if (!bay) {
    fail(`the rail at x=${x} has no arch around it`);
    continue;
  }
  const margin = bay.width / 2 - len / 2;
  if (margin < 0.03) {
    fail(`the rail at x=${x} is ${(-margin * 2).toFixed(2)} m wider than its opening`);
  } else {
    note(`  ok    rail x=${x.toFixed(2)}  ${len.toFixed(2)} m in a ${bay.width.toFixed(2)} m opening, ${margin.toFixed(2)} m each side`);
  }
}

note("\nTHE BEAMS  (the brief asks 15°–24°, quoted as the full cone)");
for (const [name, half] of Object.entries(BEAM_ANGLES)) {
  const full = (half * 180) / Math.PI * 2;
  if (full < 15 || full > 24) {
    fail(`the ${name} beam is ${full.toFixed(1)}° — outside 15°–24°`);
  } else {
    // What it actually puts on the floor from the ceiling track.
    const pool = 2 * (ROOM.height - 0.06 - 1.5) * Math.tan(half);
    note(`  ok    ${name.padEnd(7)} ${full.toFixed(1)}°  lights a ${pool.toFixed(2)} m pool on a garment`);
  }
}

note("\nARE THE COVE STRIPS HIDDEN?");
{
  // The lip hides the strip if a sight line grazing the lip's top edge
  // passes above the strip, from anywhere a person's eye can be.
  const lipTop = COVE_Y + COVE_LIP.rise / 2;
  const stripY = COVE_Y + 0.07;
  let worst: { eye: number; at: number } | null = null;
  for (const eye of [1.5, 1.6, 1.75, 1.9, 2.1, 2.6]) {
    for (let d = 0.25; d <= ROOM.depth; d += 0.05) {
      const t = (d - 0.03) / (d - COVE_LIP.proud);
      if (eye + (lipTop - eye) * t < stripY) {
        worst = { eye, at: d };
        break;
      }
    }
    if (worst) break;
  }
  if (worst) {
    fail(`a strip is visible to an eye at ${worst.eye} m from ${worst.at.toFixed(2)} m out`);
  } else {
    note(`  ok    lip ${COVE_LIP.proud * 1000} mm proud, ${COVE_LIP.rise * 1000} mm rise — hidden from every eye height up to 2.6 m`);
  }
}

note("\nARE THE WINDOWS DEEP-SET?");
{
  const glassZ = -ROOM.halfD + 0.06;
  const innerFace = -ROOM.halfD + MASONRY.deep;
  const setBack = innerFace - glassZ;
  const rise = WINDOW.arch;
  const halfSpan = WINDOW.width / 2;
  if (Math.abs(rise - halfSpan) > 1e-9) {
    fail(`the window head rises ${rise} m on a ${WINDOW.width} m span — not a true semicircle`);
  } else {
    note(`  ok    head rises ${rise.toFixed(2)} m on a ${WINDOW.width.toFixed(2)} m span — Romanesque, same as the arcade`);
  }
  if (setBack < 0.3) {
    fail(`the glass is only ${setBack.toFixed(2)} m behind the wall face — not deep-set`);
  } else {
    note(`  ok    ${(MASONRY.deep * 1000).toFixed(0)} mm of masonry, glass set ${setBack.toFixed(2)} m back from the room`);
  }
}

note(
  failures === 0
    ? "\nThe house is built, and the camera never stands in the furniture.\n"
    : `\n${failures} problem${failures === 1 ? "" : "s"}.\n`,
);
process.exit(failures === 0 ? 0 : 1);
