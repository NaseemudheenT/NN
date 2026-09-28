# Nero Noren

The digital showroom of **Nero Noren**, an online-first menswear house for men and boys.

The home page is not a landing page with a 3D background — it is a room. Limestone
walls, honed travertine, brass rails, tall arched windows and a backlit NN sign, all
generated in code, lit by the hour of the visitor's own clock. Scroll walks a camera
through it. The garments hang in it. Everything else on the site is another part of
the same building.

*Timeless style builds character.*

---

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict |
| 3D | Three.js, React Three Fiber, drei, postprocessing |
| Motion | Framer Motion, plus a scroll-driven camera rig |
| Styling | Tailwind CSS v4, CSS-first design tokens |
| Catalogue | Shopify Storefront API (headless) |
| Payments | Razorpay, signature verified server-side |
| Stylist | Claude, called only from the server |
| Owner access | Supabase magic link, gated by `OWNER_EMAILS` |

## Running it

```bash
npm install
cp .env.example .env.local   # fill in what you have; nothing is required
npm run dev
```

Nothing in `.env.local` is required to run the site. Each integration degrades
honestly on its own: the catalogue shows Collection 001 without prices, the stylist
says it is not connected, checkout says payments are not connected. **No placeholder
price, stock level or AI answer is ever invented to fill a gap.**

```bash
npm run lint      # eslint, including the React Compiler rules
npm run build     # production build
```

## How it is put together

```
app/                      routes — showroom, collection, product, trial room,
                          stylist, bag, checkout, the house, sizing, care,
                          delivery, privacy, terms, owner
  api/stylist             streams Claude, catalogue-constrained, rate-limited
  api/checkout/*          creates and verifies Razorpay orders
  api/owner/session       magic link request and session exchange

components/
  brand/                  the NN monogram and wordmark, drawn as geometry
  showroom/               the room: architecture, materials, lighting, camera,
                          garments, and the 2D fallback
  ui/glass/               the liquid-glass system
  motion/                 reveals and parallax, all from one motion language
  shop/                   collection, product, bag, checkout, search
  trial-room/  ai/  owner/  layout/

lib/
  tokens.ts               colours, lighting presets, viewpoints, motion
  fit.ts                  the fit engine
  shopify.ts              catalogue and cart
  razorpay.ts  owner.ts  client-prefs.ts  bag.ts
```

### The showroom

Four lighting presets — morning, afternoon, evening, night — describe the same room
at different hours, and blend continuously rather than switching like a theme. The
visitor's clock chooses; they can override it, and `?phase=night` forces one for
testing.

Quality is chosen from the device (GPU, memory, cores, pointer) and lowered at
runtime if frames drop. Below that there is an elegant 2D elevation of the same room,
and a "shop flat" switch that is always one tap away.

Every object is procedural at true real-world scale and every path is listed in
`components/showroom/assets.ts`. Dropping real `.glb` files into `/public/models`
replaces them one for one without touching a component.

### The fit engine

`lib/fit.ts` estimates body measurements from three numbers a customer actually knows
— height, weight, and the waist of trousers they already own — and reads them against
the garment's published size chart. Shirting is sized on the chest, trousers on the
waist, and extra room where a garment is meant to have room is not counted against
the fit. **Where a piece has published no size chart, it says so instead of guessing.**

### The stylist

`/api/stylist` hands Claude the live catalogue with every question and allows it to
recommend only what is in it. It cannot invent a piece, a price, a discount or a
delivery date. The key never leaves the server; the reply is re-emitted as plain text
so nothing about the provider reaches the browser.

## Accessibility and motion

Semantic landmarks, a skip link, keyboard paths through search, sizes, the bag and
checkout, and visible focus rings. `prefers-reduced-motion` removes camera movement,
parallax and magnetic buttons, and shortens reveals — without removing any content.

## Security

Secrets are read only in `lib/env.ts`, which is `server-only`. Card details are
entered in Razorpay's own window and never reach this application; every payment is
verified by HMAC on the server before an order is confirmed. Owner sessions are signed
cookies, `httpOnly`, and restricted to addresses in `OWNER_EMAILS`.
