import * as THREE from "three";

/**
 * NERO NOREN — the showroom's geometry.
 *
 * Everything here is built the way the building would be, because that is
 * the only way the light comes out right. The important one is the arch.
 *
 * An opening in a masonry wall is a HOLE through a solid, and the surface
 * you see when you look at the edge of that hole — the soffit, the reveal —
 * is the thickness of the wall itself. So the arches are cut as holes in an
 * extruded wall, and the soffit is simply the hole's own side wall. Nothing
 * is added to represent it; adding a separate band would be a bead of
 * moulding sitting in front of a paper-thin opening, which is what a
 * cardboard set looks like. A 450 mm wall therefore has a 450 mm reveal that
 * catches the light at a grazing angle, and the arch has visible depth.
 */

/** A round-headed opening: straight jambs to the springline, then a semicircle. */
export function archPath(cx: number, width: number, height: number, sill = 0): THREE.Path {
  const r = width / 2;
  const spring = height - r; // the jambs stop where the curve starts
  const p = new THREE.Path();
  p.moveTo(cx - r, sill);
  p.lineTo(cx - r, sill + spring);
  p.absarc(cx, sill + spring, r, Math.PI, 0, true);
  p.lineTo(cx + r, sill);
  p.closePath();
  return p;
}

/** A rectangular panel with openings cut through it, extruded to its real thickness. */
export function pierceWall(
  width: number,
  height: number,
  thickness: number,
  holes: THREE.Path[],
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height);
  shape.lineTo(-width / 2, height);
  shape.closePath();
  shape.holes.push(...holes);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 40,
  });
  geo.computeVertexNormals();
  return geo;
}

/**
 * A transverse arch — the band of masonry that springs across the nave from
 * one pier to the one opposite. It is what makes a hall read as vaulted
 * rather than as a corridor with a lid, and it is also what lays the ribbed
 * bands of shadow across the floor when the sun is low in the great window.
 *
 * Only the band is built, not the legs: below the springline the arch and
 * the pier are the same masonry, and the arcade wall is already there.
 * The shape's origin sits ON the springline, so the mesh is placed at the
 * height the arch actually springs from.
 */
export function archBand(
  span: number,
  band: number,
  depth: number,
  /** How high the crown sits above the springline. Defaults to a true
      semicircle. Anything less makes a SEGMENTAL arch — the wide, shallow
      vault a hall gets when it is broader than it is tall, and the only way
      to span thirteen metres without the crown going through the roof. */
  rise?: number,
): THREE.ExtrudeGeometry {
  const r = span / 2;
  const s = new THREE.Shape();
  s.moveTo(-r - band, 0);
  s.absarc(0, 0, r + band, Math.PI, 0, true); // extrados, over the top
  s.lineTo(r, 0);
  s.absarc(0, 0, r, 0, Math.PI, false); // intrados, back again
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: false,
    curveSegments: 44,
  });
  /* Squashed vertically into an ellipse. Doing it after the extrude rather
     than with an elliptical curve keeps the band a constant thickness
     measured horizontally, which is how voussoirs are actually cut. */
  if (rise !== undefined && rise !== r) geo.scale(1, rise / r, 1);
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * A hanging garment.
 *
 * Shoulders at the top, a slight flare to the hem, and a soft bevel so the
 * edge catches light instead of reading as a cut-out. Extruded rather than a
 * plane because a coat on a rail has a front and a back, and the gap between
 * them is what makes a rail look occupied rather than printed.
 */
export function garmentShape(length: number, shoulder: number, hem: number): THREE.ExtrudeGeometry {
  const s = shoulder / 2;
  const h = hem / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-s * 0.46, 0);           // collar, left
  shape.quadraticCurveTo(-s, -0.02, -s, -0.1);   // shoulder line
  shape.lineTo(-s * 1.02, -length * 0.42);       // sleeve/side
  shape.lineTo(-h, -length);                      // hem, left
  shape.lineTo(h, -length);                       // hem, right
  shape.lineTo(s * 1.02, -length * 0.42);
  shape.lineTo(s, -0.1);
  shape.quadraticCurveTo(s, -0.02, s * 0.46, 0);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.translate(0, 0, -0.085);
  geo.computeVertexNormals();
  return geo;
}

/** A wire hanger: the hook plus the triangle the shoulders sit on. */
export function hangerGeometry(shoulder: number): THREE.TubeGeometry {
  const s = shoulder / 2;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-s * 0.92, 0, 0),
    new THREE.Vector3(0, 0.085, 0),
    new THREE.Vector3(s * 0.92, 0, 0),
  ]);
  return new THREE.TubeGeometry(curve, 12, 0.009, 5, false);
}

/** Deterministic pseudo-random, so the room is the same room on every load. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
