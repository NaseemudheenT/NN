# NN Tower — the photographs

The building is drawn until these files exist. The drawing is honest and
complete — every floor, every hotspot and the lift all work right now — but
it is a drawing. **These three files are what make it photographic**, and
they are the one thing I cannot make for you.

Drop any of them in and it takes over on the next load. Nothing else changes:
the hotspot coordinates, the floor bands and the lighting are all positioned
from the same measurements the drawing uses, so a render drops straight in
behind geometry that is already correct.

---

## 1. `nn-tower-cutaway.webp` — the building in section

**The important one.** This is the isometric cutaway you designed: eight
levels, open to view, street to roof.

| | |
|---|---|
| Aspect | Roughly **1 : 2.4** (tall). e.g. 1600 × 3840 |
| Format | `.webp`, under ~4 MB |
| Content | The section, **floors only — no people, no labels, no text** |
| Levels | Eight bands, evenly spaced, top (roof) to bottom (Level 1) |
| Light | Each floor lit from its own windows; the stair core visible |

**The floors must be evenly spaced and in this order, top to bottom:**

```
Roof      terrace
Level 7   owner console
Level 6   bag & checkout
Level 5   AI stylist & virtual fit
Level 4   journal & archive
Level 3   men & boys
Level 2   the atelier
Level 1   collection gallery
```

The code places each band at `5.5% + n × 11.3%` of the image height. If your
render divides the frame differently, tell me the proportions and I will
change one function — `bandFor()` in `lib/tower/floors.ts` — and everything
realigns.

## 2. `nn-tower-facade-dusk.webp` — the street, at dusk

The default arrival. Travertine palazzo, lit arch, the mark above it,
warm interior glowing through the bays against a cool sky.

| | |
|---|---|
| Aspect | **3 : 2** landscape. e.g. 3000 × 2000 |
| Content | The facade and the pavement. **No people.** |

## 3. `nn-tower-facade-day.webp` — the same facade, daylight

Identical framing, shot or rendered at midday. The customer switches
between them; if the framing moves between the two it reads as a cut rather
than as the hour changing.

---

## Where these come from

- **Render them.** The isometric cutaway you already have is the brief — any
  architectural visualiser can produce it at print resolution from that image.
- **Shoot them.** A real palazzo facade in any European city, at dusk and at
  noon from the same tripod position.
- **Commission three stills.** This is three images, not a 3D model. It is
  the cheapest possible path to photorealism and the only one that actually
  gets there in a browser.

**Only use imagery you have the rights to.** This is a commercial site for a
real company.

## Nothing here yet?

Then the tower draws itself and every control works. Each file is probed with
a `HEAD` request before it is requested, so a missing one costs nothing — no
404 in the console, no broken image, no spinner.
