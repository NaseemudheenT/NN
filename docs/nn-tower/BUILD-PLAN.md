# NN TOWER — the 3D build

Real-time 3D. React Three Fiber, physically based materials, a studio lighting
rig, and a cinematic post chain. Built the way a building is built: structure
first, then the fit-out, floor by floor.

---

## Why this will not look like a game

The three earlier 3D attempts were called cartoonish, and they were. The cause
was not the polygon count. It was these four things, all of which this build
fixes at the root:

| what was wrong | why it read as a game | the fix |
|---|---|---|
| No environment map | Metal and glass had nothing to reflect, so every surface read as flat plastic | A **virtual photo studio** built from `<Lightformer>` panels inside `<Environment>` — real softboxes, real reflections, no CDN fetch |
| No tone mapping | Linear output blows highlights white and crushes shadows black — the exact look of an untreated game buffer | **ACES Filmic**, the curve used in cinema, with exposure as a real control |
| Flat colour materials | Real stone is never one value; the eye reads uniformity as synthetic | Procedural **roughness and normal maps** per material, generated at runtime |
| Hard shadows, no occlusion | Objects floated; nothing touched anything | **PCSS soft shadows** + **N8AO** ambient occlusion for true contact darkening |

Photorealism in WebGL is a *lighting and shading* problem, not a geometry
problem. That is the whole thesis of this build.

---

## The material ledger

Every surface is a measured physical material, not a colour.

| material | roughness | metalness | extra | where |
|---|---|---|---|---|
| Limestone (ashlar) | 0.74 | 0.03 | normal + AO, coarse pore | exterior facade, quoins |
| Travertine (honed) | 0.62 | 0.04 | normal, fine vein | street level & L1 floors |
| French oak | 0.42 | 0.00 | grain roughness map | parquet, millwork, rooftop deck |
| Dark walnut | 0.36 | 0.00 | tight grain | L4 library, L7 panelling |
| Basalt (honed) | 0.58 | 0.05 | fine speckle | L6 floor |
| Brushed metal | 0.26 | 0.95 | anisotropic streak | hardware, slat walls, lift |
| Blackened steel | 0.44 | 0.82 | subtle | window frames, stringers |
| Architectural glass | 0.05 | 0.00 | `transmission 0.92`, `ior 1.5`, `thickness 1.2` | dome, balustrades, shopfront |
| Smart glass (frosted) | 0.32 | 0.00 | `transmission 0.78` | L5 styling pods |
| Belgian linen | 0.92 | 0.00 | woven normal | L3 wall upholstery |
| Saddle leather | 0.56 | 0.00 | pebble normal | seating |

Palette is the **brand board**, not the pasted spec — the board wins where they
disagree. Taupe is `#6B5E52`, olive is `#3EA639`, and there is no `#D4AF37`:
gold on this brand is a *finish*, reproduced as a metallic material, never a
flat fill.

---

## The levels

| # | y (m) | level | height |
|---|---|---|---|
| 0 | 0.0 | Street — entrance & reception | 6.5 (double) |
| 1 | 6.5 | Hero board & collection gallery | 4.0 |
| 2 | 10.5 | The atelier | 4.0 |
| 3 | 14.5 | Men & boys | 4.0 |
| 4 | 18.5 | The journal & archive | 4.0 |
| 5 | 22.5 | AI stylist hub | 4.0 |
| 6 | 26.5 | The bag & checkout | 4.0 |
| 7 | 30.5 | Owner console & office | 4.0 |
| 8 | 34.5 | Rooftop — journey's end | terrace + dome |

Footprint 24 m square with a chamfered corner rotunda carrying the glass dome.
A circular atrium void runs from L1 to the dome, with the spiral stair and the
glass lift capsule inside it.

---

## Phases

Each phase ends with something you can look at and judge. Nothing moves to the
next phase until the current one is right.

### Phase 1 — Structure, light and material · **this phase**
The massing in real 3D: nine floor plates, perimeter walls with their arched
openings, the corner rotunda, the cornice, the parapet, the glass dome. The
studio lighting rig, ACES, bloom, ambient occlusion, soft shadows. Exploded
view and focus mode on springs. The glass HUD. Sixty frames a second.

### Phase 2 — The core
The spiral stair as real geometry — oak treads, blackened steel stringers, lit
glass balustrade — and the glass lift capsule, with the atrium void cut
correctly through every plate.

### Phase 3 — Street level & the city
The entrance, reception, the arcade, the pavement, trees, lamps, the
neighbouring blocks as LOD context. Day and dusk.

### Phase 4 — Fit-out, floor by floor
L1 hero board → L2 atelier → L3 men & boys → L4 archive → L5 stylist pods →
L6 checkout → L7 owner → rooftop. One floor per pass, each with its own
materials, fixtures and lighting from the ledger.

### Phase 5 — Garments and product interaction
Rails, mannequins, folded stacks. Click a piece and it lifts into an isolated
macro view that turns, with real catalogue data behind it.

### Phase 6 — Commerce in the building
Bag, checkout, stylist and trial room reached from inside the tower, wired to
the existing Shopify / Razorpay layer rather than rebuilt.

### Phase 7 — Performance and devices
Instancing, merged geometry, LOD, KTX2 textures, adaptive DPR, a 2D route that
always works with 3D off.

### Phase 8 — Polish
Camera choreography, the cinematic arrival, sound, reduced motion, keyboard
navigation, final QA.

---

## The arrival sequence

Before the customer goes in, **there is nothing to operate.**

1. **The gate.** The tower turns on its own — front, flank, back, roof — on a
   slow automatic orbit with a drifting elevation, so the building presents
   itself without anyone touching a control. On screen: the monogram, the
   name, and **Start**, dead centre. No floor selector, no menu, no panel.
2. **Start.** The glass doors slide apart on damped physics. The camera walks
   to the threshold, waits on the opening beat, then pushes through it — two
   moves, because one straight interpolation from the street to the reception
   desk travels through a stone wall.
3. **Inside.** Only now does the building hand over its controls: the lift
   panel arrives from the right, its floor buttons staggering in one by one,
   and the floor card rises from the bottom left.

That order is the whole point. A floor selector on screen before anyone has
walked in is a menu bar on a website. A floor selector that appears once the
doors are behind you is a lift.

## Where it lives

**`/` is NN Tower.** Not a route to it, not a demo of it — the address itself.
There is no home page that links to a showroom, because the showroom is the
home page. Everything a customer does happens on a floor of that building.

Repo conventions are kept: `lib/` not `data/`, `components/tower/three/` not
`src/components/`. The pasted specs assume a different project layout.

## What was removed

The entire previous design is gone: `Tower.tsx`, `Overture.tsx`,
`Elevation.tsx`, `FloorCard.tsx`, `Lift.tsx`, `Plate.tsx` and
`styles/tower.css`. The commerce drawer is kept, to be wired into product
inspection inside the building rather than rebuilt.
