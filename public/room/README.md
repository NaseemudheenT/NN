# Photography goes here

Everything in the Nero Noren showroom is currently **generated** — the
architecture from a floor plan, the surfaces from noise. That gets a long
way. It will never get all the way, because photorealism comes from
photographs: a real camera recording real light on real stone.

This folder is where that comes in.

## panorama.jpg — the whole room, real

Drop a **360° equirectangular panorama** here as `panorama.jpg` and the hall
around the customer becomes that photograph. Look in any direction and it is
correct, because an equirectangular image mapped to a sphere from its centre
is not an approximation of standing somewhere — it is the thing itself.

**What to shoot or source**

| | |
|---|---|
| Format | Equirectangular, **2 : 1** aspect (e.g. 8192 × 4096) |
| File | `panorama.jpg`, under ~6 MB — it is downloaded before the room appears |
| Content | A European showroom, gallery or hall interior, shot from standing height |
| Light | Warm interior, daylight through tall windows. The building's own lights adapt around it. |

**Where to get one**

- Shoot it: an iPhone or Android panorama app, or a 360 camera (Insta360,
  Ricoh Theta) standing in the middle of a real room
- Commission a 3D artist for a single rendered panorama
- Any licensed architectural-interior HDRI or panorama you have rights to

**Do not** use an image you do not have the rights to. This is a commercial
site for a real company.

## Nothing here yet?

Then nothing happens. The file is probed with a `HEAD` request; if it is
missing the built hall carries on exactly as it is, with no error, no
spinner, and nothing in the console. That is deliberate — for most of this
project's life there will be no file here, and the site must not care.
