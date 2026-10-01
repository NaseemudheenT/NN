/**
 * Does the camera ever stand inside the furniture?
 *
 * Checks every fixed viewpoint, every station of the homepage walk, and every
 * routed path between them against the floor plan. A camera placed inside a
 * dressed mannequin is the kind of defect that is invisible in code review,
 * obvious the moment someone scrolls, and trivially catchable here.
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
import { ROOM } from "../components/showroom/objects/Room";
import * as THREE from "three";

let failures = 0;
const note = (s: string) => console.log(s);
const fail = (s: string) => {
  failures += 1;
  console.log(`  FAIL  ${s}`);
};

/** A camera standing still may be closer to things than one walking past. */
const STANDING_CLEARANCE = 0.3;

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

note(
  failures === 0
    ? "\nThe camera never stands in the furniture.\n"
    : `\n${failures} problem${failures === 1 ? "" : "s"}.\n`,
);
process.exit(failures === 0 ? 0 : 1);
