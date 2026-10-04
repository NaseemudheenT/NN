# NN TOWER — roadmap

The building is built the way a building is built: structure first, then the
floors are fitted out one at a time. A phase is done when you can walk into it.

---

## Phase 0 — Site & survey · **DONE**

The five NN Tower renders and the great-hall interior cut out of the concept
boards, healed of every caption and annotation line printed over them, black
point matched to the page, resampled 2x. Nine levels modelled as data, each
with an anchor measured against the cutaway until it landed on the room it
names.

`scripts/extract-tower-plates.py` · `lib/tower/plates.ts` · `lib/tower/floors.ts`

## Phase 1 — Structure & shell · **DONE**

The section render as the navigation. The lighting rig that puts one floor in
light and the rest in shadow. Leader-line annotation on hover. The lift — nine
levels plus stylist, trial room, search, bag, sound. The arrival film: mark,
aerial, street, facade, door. A phone layout that stacks instead of shrinking.

## Phase 2 — Street level & Level 1 · **DONE**

The two levels that have a photograph of their own. Street level is the facade;
the collection gallery is the great hall. Hotspots carry real catalogue handles
and read their prices from the catalogue at render.

---

## Phase 3 — Fit-out, floor by floor · **NEXT**

Six levels currently have the building and the type but no interior of their
own. Each needs one render, in the house style, landscape, no people, no text:

| level | what the plate should show |
|---|---|
| 2 · The atelier | cutting bench, cloth, pattern, the tools |
| 3 · Men & boys | the two rails at two scales, one room |
| 4 · Journal & archive | the library wall, a reading table |
| 5 · AI stylist hub | the lit fitting pods, from inside |
| 6 · Bag & checkout | packing bench, boxes, the counter |
| 7 · Owner | the private desk, the city behind it |
| Rooftop | the terrace at eye level, not from above |

Drop each into `public/assets/tower/`, add it to the script's plate table, and
set `plate:` on that level in `lib/tower/floors.ts`. Nothing else changes.

## Phase 4 — The garments

Real photographs of real pieces, replacing the placeholder garment imagery.
This is the one phase I cannot start: it needs the clothes, shot.

## Phase 5 — Sound & motion polish

The room tone engine already exists (`lib/soundscape-engine.ts`) — a floor tone
per level, cross-faded by the lift. Plus the pass over easing and timing that
only makes sense once the floors are real.

## Phase 6 — Commerce live

`SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN` and the Razorpay keys in
Vercel. Until they are set the catalogue runs on the Collection 001 seed, which
is clearly labelled as a seed and is not pretending to be a live store.

---

## The one change that improves everything at once

The plates are cut from composite boards 1254px wide, so each view is only
~500px before resampling. **Re-export the five NN Tower renders at 2048px or
more, each on its own, with no captions, no annotation lines and no label
columns.** Re-run the script and the entire site gets sharper — no code change,
because the crops are stored as fractions of the source.
