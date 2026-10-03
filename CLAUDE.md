# NERO NOREN (NN) — project rules

## What this is
The official website of NERO NOREN, an online-first, European-inspired menswear brand from India (company: NERO NOREN Private Limited, founder: Naseemudheen). The home page IS a 3D European elite showroom. Customers walk through it, see garments on racks and mannequins, try pieces in a trial room, get help from an AI stylist, and buy.

**This folder (`Projects/NN`) is the only live product.** `Projects/nero-noren` is archived. Do not implement features there.

## Locked stack
Next.js (App Router) + TypeScript (strict), React Three Fiber + drei + @react-three/postprocessing, GSAP, Framer Motion, Tailwind CSS, Shopify Storefront API (headless) for products and cart, Razorpay for payments, Claude API (server-side only) for AI, Supabase for owner auth and analytics, Vercel for hosting.

## Brand
Source of truth: the NN brand board (2026). Where it and anything else disagree, the board wins.

Tagline: "Timeless style builds character."
Audience lockup: MEN & BOYS.
Supporting lines: "More than clothing, a lifestyle." · "Crafted for what comes next."

Palette, exactly as the board states it:
Deep Black #0A0A0A · Ivory #F7F5EF · Charcoal #2E2E2E · Stone #B7B1A7 · Taupe #6B5E52 · Olive #3EA639 · Burgundy #A41F34.
Described as earth tones inspired by European heritage and timeless elegance.

Gold is a MATERIAL, not a palette colour. The board shows it only as a physical
finish — foil on the hangtag and the shopping bag, the engraved button, the
embroidery, the illuminated signage. So in the interface gold appears as a
metallic treatment that responds to light, never as a flat accent fill. Flat
gold text on ivory is a misuse of the identity.

Marks: the primary monogram is two interlocked serif Ns, the second overlapping
the first so they share a stem — simple, strong, timeless. The wordmark is
NERO NOREN in a refined serif with wide letterspacing — elegant, refined,
European. The stacked lockup pairs them — premium, versatile, iconic. Black and
white variations both exist and both must work.

Fonts: Cormorant Garamond (display), Hanken Grotesk (UI).
Voice: calm, precise, warm. Sentence case in prose; wide-tracked uppercase for
labels and metadata only. No hype words, no emojis, no fake scarcity, no fake
luxury or origin claims.
Design reference: /reference/nero-noren.html

## Collection 001 — The Foundations
The Oxford (Bianco, Azure), The Poplin (Écru), The Stripe (Marine), The Tailored Trouser (Sable, Charcoal, Marine), The Pleated Trouser (Pierre). Prices and specs come from Shopify, never hardcoded.

## Engineering rules
- 3D assets live in /public/models as Draco-compressed .glb with KTX2 textures. Every 3D object MUST have a placeholder fallback so the site works before real assets exist.
- Performance budget: first showroom view interactive in under 4 s on a mid-range Android over 4G; JS under 300 KB gzipped before 3D assets; adaptive quality (lower resolution, fewer effects) on weak devices.
- A 2D shop mode MUST always be one tap away and must work with 3D disabled.
- Respect prefers-reduced-motion. Keyboard accessible. WCAG AA contrast.
- API keys only in .env.local, read on the server. NEVER expose them to the browser. NEVER commit .env files.
- No visitor tracking before consent (India DPDP Act).

## Working rules for Claude Code
- Only make changes the current prompt asks for. Do not add features, refactors or dependencies beyond the task.
- Stop and ask before: deleting any file, adding a dependency not named in the prompt, changing the database schema, or running any deploy.
- After each step, report what was completed and show the command output that proves it works.
- Run `npm run build` and `npm run lint` before declaring any prompt done.

## Catalogue source note (implementation decision)
Shopify Storefront API is the source of truth whenever SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_TOKEN are set. When they are absent the site falls back to /lib/catalog/seed.ts, a clearly-labelled Collection 001 seed so the showroom, collection, product, trial room and stylist all stay live before the Shopify store is connected. Components never hardcode products or prices — they read whatever the catalogue layer returns. A build-time banner names the missing env vars.
