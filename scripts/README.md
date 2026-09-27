# scripts

| Script | What it does |
|---|---|
| `models-manifest.mjs` | Re-scans `/public/models` and `/public/hdri` and rewrites `manifest.json`. Run it after adding 3D assets — the showroom reads the manifest to decide, per object, between a real model and its placeholder. |

## /public/threeui/nn-ai-button.html

The NN Stylist button's scene. Derived from ThreeUI's `GlassAiButton` at
registered revision **SHA-256 `a484571de316`**, whose three published file
hashes were verified before any edit.

It carries 20 rebranding edits from the original: the emissive palette rotated
from deep blue to NN gold with luminance preserved (so bloom and additive
blending behave exactly as authored), the reflected environment changed from a
cool studio to the warm NN room, the lettering changed to NN STYLIST in a
serif, the traced brain replaced with the NN monogram, and every piece of
"GPT 6 Sol" copy replaced — including the screen-reader status announcement,
which a blind customer would otherwise hear.

To re-derive it from a newer ThreeUI revision, fetch
`https://threeui.com/source-code/glass-ai-button.json`, verify the hashes it
publishes, and re-apply those edits. Every edit was asserted against an exact
expected occurrence count, so a replacement that silently misses fails loudly
instead of shipping half-branded.
