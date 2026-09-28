# NERO NOREN

The official website of NERO NOREN — an online-first, European-inspired menswear
house for men and boys, from India. The home page **is** a 3D showroom: customers walk through it,
see garments on the rails and mannequins, try pieces in a trial room, ask an AI
stylist, and buy.

> *Timeless style builds character.*

---

## What this is

A full Next.js application, not a page. The parts that make it a real shop:

| Piece | What it does | Status |
|---|---|---|
| **Next.js on Vercel** | The site itself, server-rendered, running all day | ready to deploy |
| **Shopify Storefront API** | Products, prices, stock, cart — edited from your phone | needs your keys |
| **Razorpay** | UPI, cards, netbanking, with server-verified signatures | needs your keys |
| **Claude API** | The stylist, and the owner console's command centre | needs your key |
| **Supabase** | Owner login, showroom settings, consented analytics | needs your keys |
| **The 3D showroom** | Runs in the customer's browser, lit by their own clock | working now |

Without any keys the site still runs end to end on the Collection 001 reference
catalogue, and says clearly on the page which environment variable is missing.
Nothing is faked silently.

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in what you have
npm run dev
```

Open http://localhost:3000.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run models:manifest` | Re-scan `/public/models` and `/public/hdri` after adding assets |

---

## The things that are genuinely computed

Three parts of this site do real arithmetic rather than approximating a look.

### The light — `lib/daytime.ts`

The showroom is lit by the visitor's own sky, not by four hand-picked presets.

- **Sun position** from the NOAA solar position algorithm, evaluated against the
  visitor's local clock, calendar date and longitude. Longitude is inferred from
  the browser's UTC offset, so nothing has to ask for location permission.
- **Colour** from a Planckian-locus blackbody model. A low sun is red here for
  the reason it is red outside: Kasten–Young optical air mass rises as the sun
  drops, and the long air path scatters the short wavelengths out.
- **Brightness** from the Meinel clear-sky model, `I = I₀ · 0.7^(AM^0.678)`.
- **Refraction** near the horizon from Bennett's formula.

So the room at 08:00 in June is not the room at 08:00 in December, and the
shadows fall where they would actually fall.

One deliberate liberty: the building is oriented so its window wall catches the
day. The computed azimuth is mapped onto a sweep across that wall, because
otherwise the sun would spend half of every day behind solid masonry.

### The fit — `lib/fit.ts`

Not a lookup table. The torso is treated as a cylinder of a given height and
mass, so girth scales as `√(mass / height)`. Fitted against published male
anthropometry the result is `chest ≈ 160·√(M/H) − 5`, accurate to about ±3 cm.

Ease — the number that actually decides how a shirt feels — is then
`garment measurement − body measurement`, computed against the real finished
measurements from the size chart, and reported per area.

Every returned figure says whether it was measured or estimated. A stated jeans
waist always overrides the model, because a measured number beats a modelled one.

### The money — `lib/money.ts`, `lib/razorpay.ts`

Money is an integer number of paise everywhere. `0.1 + 0.2 !== 0.3`, and a rupee
lost to binary rounding in a cart total is a real rupee.

Totals are computed on the server from the catalogue, never taken from the
request — a client that can send its own total can send a smaller one. A payment
is real only once `HMAC-SHA256(order_id|payment_id)` verifies in constant time
**and** Razorpay itself confirms the capture and the amount.

---

## Layout

```
app/                    routes, API handlers, sitemap, robots, OG image
components/
  brand/                the NN monogram: one letterform, flat and extruded
  showroom/             the 3D room, its objects, lighting and camera
  shop/                 catalogue, cards, bag, garment drawings
  trial/                the fitting room and the fit engine's interface
  stylist/              the AI stylist
  owner/                the owner console
  layout/, theme/       shell, theme engine, consent
lib/
  daytime.ts            solar position, colour temperature, sky state
  fit.ts                body estimate and ease
  shopify.ts            Storefront API
  razorpay.ts           orders and signature verification
  india.ts              PIN codes, mobile numbers, delivery windows
  catalog/              the catalogue layer and the Collection 001 seed
  business.ts           the owner console's figures
public/models/          3D assets, plus the manifest that makes them optional
reference/              the approved design prototype
```

---

## 3D assets

The showroom is built entirely from procedural placeholders at the correct
real-world sizes and materials. Every object checks
`/public/models/manifest.json` first and uses a real `.glb` when one is present.

To swap in real assets: drop the files into `/public/models`, run
`npm run models:manifest`, and the showroom uses them. **No code changes.**

The expected paths, sizes and formats are in
[`public/models/README.md`](public/models/README.md) and declared in
`components/showroom/assets.ts`.

Photographed lighting goes in `/public/hdri/{morning,afternoon,evening,night}.hdr`.
Without it the room builds its own environment out of emissive planes — no CDN
request, no multi-megabyte download, and brass still reads as brass.

---

## Performance

The budget in `CLAUDE.md` is: first showroom view interactive under 4 s on a
mid-range Android over 4G, and under 300 KB of JavaScript gzipped before 3D.

- **First-load JS: 119 KB gzipped.**
- three.js, R3F, drei and postprocessing are a dynamic import — the page paints
  a CSS showroom first, then the 3D arrives and takes over.
- Quality adapts from measured frame rate, not from a user-agent guess.
- A 2D shop is always one tap away and works with 3D off entirely.

---

## Privacy

Built to India's DPDP Act, and slightly beyond it.

- Nothing is counted before the visitor agrees. Declining changes nothing else.
- Analytics events carry no IP address, no device id, no user agent. There is no
  field for them. Timestamps are rounded to the hour.
- Measurements never leave the device.
- Card details are entered in Razorpay's own window and never reach us.
- API keys are read on the server only and never reach the browser.

---

## Deployment

See [`DEPLOY.md`](DEPLOY.md) for the accounts to create, the keys to obtain, the
Shopify metafields to add and the two Supabase tables to create.

---

© Nero Noren Private Limited
