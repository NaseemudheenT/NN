/**
 * Bake every surface to a PNG so a human can look at it.
 *
 * `npx tsx scripts/surface-preview.ts <outDir>`
 *
 * Textures are the one part of this project that cannot be verified by a
 * test — "does travertine look like travertine" is a question only an eye
 * answers. So this writes them out. It exists because the alternative is
 * shipping surfaces nobody has seen, which is how the hall ended up looking
 * like a cartoon in the first place.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { sample, type SurfaceKind } from "../lib/textures";

const SIZE = 256;
const KINDS: { kind: SurfaceKind; colour: [number, number, number] }[] = [
  { kind: "travertine", colour: [217, 201, 173] },
  { kind: "limewash", colour: [228, 217, 198] },
  { kind: "oak", colour: [63, 42, 27] },
  { kind: "marble", colour: [42, 33, 26] },
  { kind: "leather", colour: [107, 63, 34] },
  { kind: "brass", colour: [197, 160, 89] },
];

/** Minimal PNG encoder — no dependency, and it only has to do RGB8. */
function png(width: number, height: number, rgb: Uint8Array): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 3 + 1)] = 0; // filter: none
    rgb.subarray(y * width * 3, (y + 1) * width * 3).forEach((v, i) => {
      raw[y * (width * 3 + 1) + 1 + i] = v;
    });
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const out = process.argv[2] ?? ".";
mkdirSync(out, { recursive: true });

/* One contact sheet: albedo on top, the height field below it, so the
   pattern and the relief can be compared at a glance. */
const cols = KINDS.length;
const sheet = new Uint8Array(SIZE * cols * SIZE * 2 * 3);
const put = (x: number, y: number, r: number, g: number, b: number) => {
  const p = (y * SIZE * cols + x) * 3;
  sheet[p] = r;
  sheet[p + 1] = g;
  sheet[p + 2] = b;
};

KINDS.forEach(({ kind, colour }, c) => {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const s = sample(kind, x / SIZE, y / SIZE);
      put(c * SIZE + x, y,
        Math.min(255, colour[0] * s.tone),
        Math.min(255, colour[1] * s.tone),
        Math.min(255, colour[2] * s.tone));
      const h = Math.min(255, s.height * 255 * 1.6);
      put(c * SIZE + x, SIZE + y, h, h, h);
    }
  }
  console.log(`  ${kind}`);
});

writeFileSync(`${out}/surfaces.png`, png(SIZE * cols, SIZE * 2, sheet));
console.log(`\nwrote ${out}/surfaces.png  (top: albedo · bottom: height)`);
