# /public/models

Drop real assets here. The showroom picks them up with no code change — run
`node scripts/models-manifest.mjs` afterwards to refresh `manifest.json`, which
is how each object decides between the real model and its placeholder.

Expected layout and paths are declared in `components/showroom/assets.ts`.

```
room/shell.glb              the room: floor, walls, ceiling, window reveals
room/floor-monogram.glb     brass-inlaid NN monogram at the entrance
room/windows.glb            tall arched steel-framed windows
fixtures/counter.glb        walnut service counter
fixtures/wall-sign.glb      backlit NN wall sign
fixtures/rail.glb           brushed-brass garment rail, 1.8 m
fixtures/hanger.glb         NN brass hanger
fixtures/table.glb          low oak table
fixtures/mannequin.glb      matte-black mannequin
fixtures/mirror.glb         full-length antique-bronze mirror
fixtures/doorway.glb        doorway and ivory linen curtain
fixtures/lamp.glb           brass picture lamp
props/shopping-bag.glb      NN embossed shopping bag
props/box.glb               box with NN tissue paper
garments/<handle>-hanger.glb
garments/<handle>-folded.glb
garments/<handle>-worn.glb
body.glb                    neutral body for the trial room
trial/*.glb                 the fitting room
```

## Requirements

- Real-world scale, in metres. The room is 12 m × 8 m with a 4.5 m ceiling.
- Draco-compressed geometry, KTX2 textures.
- Under 15 MB for the whole room, under 3 MB per garment.
- Y up, Z forward, origin at the object's floor contact point.
- Separate objects, not one merged mesh, so they can be placed individually.

## HDRI lighting

`/public/hdri/{morning,afternoon,evening,night}.hdr` — real photographed light.
Free starting points are at polyhaven.com. Without them the room uses drei's
built-in presets, and the sun itself is always computed from the visitor's clock.
