# NN TOWER — where it stands

`/` is NN Tower. Not a page about a building, not a route to one: the address
itself. The customer arrives on the street outside, presses Start, the doors
open, and every floor is reached from inside.

## Built

| | |
|---|---|
| **Sky** | Preetham Rayleigh/Mie scattering from a real sun vector · moon with generated maria · stars · cloud banks |
| **Street** | Pavement, kerb, lamps, trees, eight context blocks, sliding glass entrance doors |
| **Shell** | 24 m footprint, chamfered corner rotunda, glass dome, limestone ashlar, arched bays, cornice, string course per floor |
| **Core** | Oak spiral stair (178 mm rise, 280 mm going) · glass capsule lift reading real floor heights |
| **Street level** | Reception desk, check-in portals, working map, coffered ceiling, columns at 1:8 with entasis |
| **Level 1** | Hero board, curved campaign wall, acoustic slat wall, rails, pedestals under spot track |
| **Level 2** | Atelier — 3.2 m cutting table, cloth half-unrolled, racked bolts, dress forms |
| **Level 3** | Men & boys in one room, boys' side at 72%, herringbone parquet, linen in picture rail |
| **Level 4** | Archive — oak stacks, generated books, reading table, wingbacks, 2600 K |
| **Level 5** | Stylist pods — frosted switchable glass, luminous ceiling, 5000 K |
| **Level 6** | Checkout — slat wall as real channels, cartons, packing bench, counters |
| **Level 7** | Owner — oak panelling, walnut desk, meeting table, blank dashboards |
| **Rooftop** | Oak deck, frameless glass balustrade with its shoe, clipped boxwood, lounge |

**The building opens.** Inside, the two camera-facing elevations are removed and
all nine floors are readable at once — the sectioned view from the reference
board. Closed on the gate screen.

**The shop is in the building.** Touch points open the real drawer, bag and
stylist. Prices are looked up from the catalogue at render and stored nowhere.

## Honest state

- **Not done:** garment turntable on click; bag and checkout reached without
  leaving the page; sound; keyboard navigation; the final device pass.
- **Owner dashboards are deliberately blank.** Modelling revenue figures into
  the architecture would put fabricated business data in the product. The real
  console is at `/owner` behind real authentication.
- **Catalogue runs on the Collection 001 seed** until `SHOPIFY_STORE_DOMAIN`
  and `SHOPIFY_STOREFRONT_TOKEN` are set in Vercel. Razorpay likewise.
- **No product photography yet.**

## Performance

`?quality=low|medium|high` overrides the auto-detect. Low drops ambient
occlusion, the normal pass, anti-aliasing, clouds and most stars.

Light count is the thing to watch: three.js forward-renders, so cost scales
with lights × materials and a shader variant is compiled per light count. A
lamp behind every fixture reached ~47 lights. Fixtures now keep their emissive
surfaces and lose the point light behind them — a lamp you can see reads as a
lamp that is on.

## Verification

Headless Chrome on this Mac cannot get a GPU (Metal backend tested; WebGL
unavailable), so renders go through SwiftShader on CPU and a frame of this
scene takes minutes. `npm run dev` on a machine with a GPU is the real check.
