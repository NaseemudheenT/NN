#!/usr/bin/env node
/**
 * Writes /public/models/manifest.json listing every .glb actually present.
 *
 * Run this after dropping real assets in. The showroom reads the manifest to
 * decide, per object, whether to load a model or draw its placeholder — so a
 * missing file costs nothing and a new file needs no code change.
 *
 *   node scripts/models-manifest.mjs
 */
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not URL.pathname: a project folder with a space in its
// name would otherwise arrive percent-encoded and nothing would be found.
const ROOT = fileURLToPath(new URL("../public/models/", import.meta.url));
const HDRI_ROOT = fileURLToPath(new URL("../public/hdri/", import.meta.url));

async function walk(dir, match = /\.(glb|gltf)$/i) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, match)));
    else if (match.test(e.name)) out.push(full);
  }
  return out;
}

const models = (await walk(ROOT))
  .map((f) => "/models/" + relative(ROOT, f).split(sep).join("/"))
  .sort();

// Photographed lighting lives in /public/hdri and is listed in the same
// manifest, so one fetch tells the showroom everything it has to work with.
const hdri = (await walk(HDRI_ROOT, /\.(hdr|exr)$/i))
  .map((f) => "/hdri/" + relative(HDRI_ROOT, f).split(sep).join("/"))
  .sort();

await mkdir(ROOT, { recursive: true });
await writeFile(
  join(ROOT, "manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), models, hdri }, null, 2) + "\n",
);

console.log(`manifest.json — ${models.length} model(s), ${hdri.length} HDRI(s)`);
for (const m of [...models, ...hdri]) console.log("  " + m);
