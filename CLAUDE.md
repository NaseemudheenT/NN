# NERO NOREN (NN) — project rules

## What this is
The official website of NERO NOREN, an online-first, European-inspired menswear brand from India (company: NERO NOREN Private Limited, founder: Naseemudheen). The home page IS a 3D European elite showroom. Customers walk through it, see garments on racks and mannequins, try pieces in a trial room, get help from an AI stylist, and buy.

## Locked stack
Next.js (App Router) + TypeScript (strict), React Three Fiber + drei + @react-three/postprocessing, GSAP, Framer Motion, Tailwind CSS, Shopify Storefront API (headless) for products and cart, Razorpay for payments, Claude API (server-side only) for AI, Supabase for owner auth and analytics, Vercel for hosting.

## Brand
Colours: Matte Black #000000, Ivory #EFE9DD, Charcoal #3A3A3D, Stone #B8AE9C, Taupe #8A7B6A, Olive #4F5443, Burgundy #5C1F24, NN Gold #C9A43A.
Fonts: Cormorant Garamond (display), Hanken Grotesk (UI). Tagline: "The art of dressing well."
Voice: calm, precise, warm. Sentence case. No hype words, no emojis, no fake scarcity, no fake luxury or origin claims.
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
