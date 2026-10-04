# NN Tower — the plates

Six photographic views of NN Tower. **These files are the building.** Nothing
on the site draws it with geometry.

| file | what it is | used by |
|---|---|---|
| `cutaway.webp` | the section — nine levels, cut open | the tower navigation |
| `facade.webp` | the front at dusk | the arrival, and street level |
| `street.webp` | from the boulevard | the overture, second cut |
| `aerial.webp` | from above, by day | the overture, first cut; the rooftop |
| `hall.webp` | the great hall inside | the collection gallery |
| `rear.webp` | the back elevation | held in reserve |

`plates.json` carries each one's dimensions and a 20px inline blur. Both it and
`lib/tower/plates.ts` are **generated** — do not hand-edit either.

## Regenerating

    python3 scripts/extract-tower-plates.py   # needs Pillow + numpy
    node /tmp/genplates.cjs                   # or regenerate lib/tower/plates.ts

The script cuts these out of two source boards in `~/Downloads`, heals the
captions and annotation leader lines printed over them, matches the cutaway's
background to the page's black, pads it for headroom, and resamples 2x.

Crop rectangles are stored as **fractions** of the source, so re-exporting the
boards at a higher resolution needs no code change — just re-run and the plates
get sharper on their own.

## If you re-export the boards

The plates are currently cut from 1254px-wide composite sheets, which is why
nothing in the interface blows one up much past 1.5x. Re-exporting the five
NN Tower renders at **2048px or more, each on its own** — no captions, no
annotation lines, no label columns — is the single change that would make the
whole site sharper. Drop them in and adjust the source paths at the top of the
script.

## Careful: the anchors

`lib/tower/floors.ts` positions all nine level markers as **percentages of
`cutaway.webp`**. They were measured against the render by eye, one at a time,
until each landed on the room it names. Re-cropping or re-padding that plate
invalidates every one of them — re-measure by drawing the markers onto the
plate and looking at the result, not by arithmetic alone.
