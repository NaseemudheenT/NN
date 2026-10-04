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

---

## What this build deliberately does not do

The master directive pasted alongside the renders asks for real-time 3D:
React Three Fiber, Three.js, GLB/glTF from Blender, a staircase as actual
geometry, an elevator with doors that open on a camera move, free walk-through
exploration. None of that is here, and that is a decision, not an omission.

The note that has come back more than any other is that the site must look
**real, and not like a cartoon or a game**. Real-time 3D in a browser is the
thing that produces the game look. A browser cannot ray-trace limestone, cannot
do subsurface scattering in stone, and cannot afford the bounce light that
makes an interior read as photographed. Everything it *can* draw at sixty
frames a second looks like a game engine — and post-processing only puts bloom
on a cartoon. Three attempts proved it.

Photographs composited in depth give the opposite trade: perfect material
fidelity, no geometry budget, 1.19 MB of client JS instead of 3.4 MB, and a
building that holds up at full screen. What is given up is free camera
movement. You cannot walk the floor; you look into it.

If that trade is the wrong one for NN, say so and it goes back to R3F — the
packages are still installed. But it should be an explicit choice, made
knowing that the cartoon look and real-time 3D are the same decision.

## What was rejected from the reference implementation

The `nero_noren_nn_tower_digital_flagship.tsx` file was read as reference. None
of it shipped. It contained:

- **Firebase** auth and Firestore — this project runs Supabase.
- **Fabricated business metrics** presented as live: €148,250 revenue, 1,428
  visitors, 389 AI sessions, 42 bookings, "↑ 24.1% monthly target".
- **A fabricated address** — "Via Monte Napoleone 8, 20121 Milano MI, Italy".
  NERO NOREN Private Limited is an Indian company.
- **Unsplash stock photography** used as the product catalogue.
- **Invented products, specs and origin claims** — "Super 160s Wool",
  "Hand-crafted in Naples", "100% Mongolian Cashmere", prices in EUR.
- **Flat `#D4AF37` as a text and fill colour** throughout. The brand board
  shows gold only as a physical finish; flat gold type is a misuse of it.
- **A Gemini API key placeholder in client-side code**, calling the model
  directly from the browser. Any key put there ships to every visitor.
