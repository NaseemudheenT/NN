import * as THREE from "three";

/**
 * The NN monogram as extrudable 2D shapes, in the same construction as the
 * SVG mark so the brass sign, the floor inlay and the header logo are one
 * identical piece of geometry at three scales.
 *
 * Source space is the SVG's 158 × 120 box with y pointing down; the result
 * is y-up, height 1, centred on the origin.
 */
const STEM = 10;
const SERIF = 4.5;
const TOP = 16;
const BOT = 104;
const OFFSET = 58;
const W = 100 + OFFSET;
const H = 120;

function toLocal(x: number, y: number): [number, number] {
  return [(x - W / 2) / H, (H - y - H / 2) / H];
}

function poly(points: [number, number][]) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => {
    const [lx, ly] = toLocal(x, y);
    if (i === 0) shape.moveTo(lx, ly);
    else shape.lineTo(lx, ly);
  });
  shape.closePath();
  return shape;
}

function rect(x: number, y: number, w: number, h: number) {
  return poly([
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);
}

function singleN(x: number): THREE.Shape[] {
  const l = x + 20;
  const r = x + 70;
  return [
    poly([
      [l, TOP],
      [l + 24, TOP],
      [r + STEM, BOT],
      [r + STEM - 24, BOT],
    ]),
    rect(l, TOP, STEM, BOT - TOP),
    rect(r, TOP, STEM, BOT - TOP),
    rect(l - 9, TOP - SERIF, STEM + 18, SERIF),
    rect(r - 9, TOP - SERIF, STEM + 18, SERIF),
    rect(l - 9, BOT, STEM + 18, SERIF),
    rect(r - 9, BOT, STEM + 18, SERIF),
  ];
}

let cached: THREE.Shape[] | null = null;

export function monogramShapes(): THREE.Shape[] {
  if (!cached) cached = [...singleN(0), ...singleN(OFFSET)];
  return cached;
}

/** Aspect of the mark: width ÷ height. */
export const MONOGRAM_ASPECT = W / H;
