# NERO NOREN — Website Build Kit
Repo: `github.com/NaseemudheenT/NN` (empty as of 27 Sep 2026)
Target tool for all prompts: **Claude Code**, run inside a local clone of the repo.

---

## Part 1 — What makes a website look "real"

Code controls the lighting, camera, motion and interaction. Code cannot invent photoreal objects. A real-looking showroom needs three kinds of real assets:

1. **The showroom model.** A 3D room (walls, stone floor, oak shelving, brass rails, mirrors, lamps, NN signage) built by a 3D artist in Blender, exported as compressed `.glb` files. An AI 3D tool (Rodin, Meshy, Tripo) can make individual props, but the room itself needs an artist for true realism.
2. **The garments.** Made in fashion design software (CLO 3D or Marvelous Designer) from your real tech packs and fabric scans. The software simulates real cloth drape, so the Oxford looks like an Oxford. Export each one as `.glb`. This is also where the NN back-neck label, buttons and hangtag are modelled.
3. **Lighting references (HDRIs).** Real photographed light for morning, afternoon, evening and night. Free ones from Poly Haven work to start with.

Until those assets arrive, Claude Code builds the whole system with high-quality placeholders. When real assets arrive, you drop them into `/public/models` and the site becomes photoreal without rewriting code. That is the plan the prompts below follow.

**Trial room, honestly:**
- **Version 1 (build first):** the customer enters their height, weight and fit preference. A 3D body is scaled to match, and the garment is shown on it with fit notes (tight, regular, easy) per area. Reliable, works on every phone.
- **Version 2:** photo try-on. The customer uploads a photo and an AI try-on service dresses them in the garment. This needs a paid third-party API and a clear privacy consent.
- **Version 3:** live camera AR. Save this for after launch. It's the hardest to make look good.

**Performance rule:** most Indian customers will visit on a mid-range Android phone over mobile data. The 3D showroom must load its first view in under 4 seconds, and there must always be a fast 2D shop mode one tap away. A beautiful site that doesn't load sells nothing.

---

## Part 2 — Locked decisions

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Fast, SEO-friendly, deploys easily |
| 3D | React Three Fiber + drei + postprocessing | Best 3D stack for React |
| Motion | GSAP + Framer Motion | Smooth camera moves and UI transitions |
| Styling | Tailwind CSS with NN design tokens | Consistent brand everywhere |
| Store backend | Shopify (headless, Storefront API) | You add products, prices and stock in the Shopify app. No code needed to run the shop |
| Payments | Razorpay (UPI, cards, netbanking) | Standard in India |
| AI | Claude API, called only from the server | Stylist, trial-room fit notes, owner console |
| Owner data and login | Supabase | Owner console login, analytics and AI logs |
| Hosting | Vercel | One-click deploys from GitHub |
| Privacy | India DPDP Act consent banner | Needed before tracking visitors |

**Brand tokens** (from the NN brand board): Matte Black `#000000`, Ivory `#EFE9DD`, Charcoal `#3A3A3D`, Stone `#B8AE9C`, Taupe `#8A7B6A`, Olive `#4F5443`, Burgundy `#5C1F24`, NN Gold `#C9A43A`. Display font Cormorant Garamond, UI font Hanken Grotesk. Tagline: *The art of dressing well.*

**Time-of-day showroom** (uses the visitor's own clock):

| Local time | Showroom mood | Site theme |
|---|---|---|
| 06:00–11:59 Morning | Cool soft daylight through tall windows, long gentle shadows | Light (ivory) |
| 12:00–16:59 Afternoon | Bright neutral daylight, crisp shadows | Light (ivory) |
| 17:00–19:29 Evening | Warm golden-hour light, lamps switch on | Transitional |
| 19:30–05:59 Night | Windows dark, warm pools of lamp light, gold glows | Dark (matte black) |

Transitions blend smoothly over 60 seconds. The visitor can always override with the theme switch.

**NN brand details that must appear in 3D:** back-neck woven label on every shirt, NN engraved buttons, NN hangtag, NN brass hangers, NN embossed shopping bag on the counter, NN monogram inlaid in the floor at the entrance, backlit NN wall sign, NN tissue paper in boxes.

---

## Part 3 — Before you start (your checklist)

1. Install Claude Code and open a terminal in your cloned `NN` folder.
2. Create free accounts: Vercel, Supabase, Shopify (development store), Razorpay (test mode), Anthropic Console (for the Claude API key).
3. Never paste keys into a prompt or into chat. Claude Code will create a `.env.local` file with blank slots. You type the keys into that file yourself.
4. Copy `nero-noren.html` (the prototype we built) into the repo at `/reference/nero-noren.html`. Claude Code uses it as the design reference.
5. Paste **one prompt at a time**. Check the result in your browser before moving to the next one.

> ⚠️ These prompts are for an agentic tool with real system access. Review the scope locks, forbidden actions and stop conditions before pasting. Confirm the file paths match your actual project.

---

## Part 4 — The prompts (paste in order)

### Prompt 0 — Project memory (creates CLAUDE.md)

```
Create a file named CLAUDE.md in the repository root with exactly the content below, then stop. Do not create any other files.

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
```

### Prompt 1 — Foundation and design system

```
Read CLAUDE.md and /reference/nero-noren.html first.

Starting state: the repo contains only CLAUDE.md and /reference.
Goal: a working Next.js foundation with the NN design system. No 3D yet.

Do:
1. Scaffold Next.js (App Router, TypeScript strict, Tailwind, ESLint) in the repo root. Allowed dependencies for this prompt: next, react, react-dom, tailwindcss, framer-motion, and their required dev tooling.
2. Put the NN colour tokens and fonts from CLAUDE.md into the Tailwind config and CSS variables, with a light theme (ivory) and a dark theme (matte black).
3. Build a ThemeProvider with three modes: "auto" (default), "light", "dark". Auto picks the theme from the visitor's local time using the table: 06:00–16:59 light, 17:00–19:29 evening (light tokens, warmer accent), 19:30–05:59 dark. Store the visitor's override in localStorage. Expose the current time-of-day phase (morning, afternoon, evening, night) through a React hook `useDayPhase()` because the 3D showroom will use it later.
4. Build the site shell: header (NN wordmark, links to Showroom, Collection, Trial Room, Stylist, Bag), footer, and empty pages for /, /collection, /product/[handle], /trial-room, /stylist, /bag, /owner.
5. Create .env.example with blank slots: SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_TOKEN, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Add .env* (except .env.example) to .gitignore.

Done when: `npm run dev` shows the shell, the theme switch works, `useDayPhase()` returns the right phase for the current time, and `npm run build` and `npm run lint` pass.
Stop after this prompt and summarise the files created.
```

### Prompt 2 — The 3D showroom with time-of-day lighting

```
Read CLAUDE.md. Build only the 3D showroom on the home page.

Allowed new dependencies: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap.

Do:
1. Create /components/showroom/ with a Showroom scene rendered on the home page. The layout is a European elite menswear boutique: entrance with an NN monogram inlaid in a stone floor, a tall backlit NN wall sign behind a walnut counter, two long brass garment rails for shirts, a low oak table with folded trousers, two mannequins, a full-length mirror, arched tall windows on one wall, a doorway leading to a trial room.
2. Build every object as a separate component that loads a .glb from /public/models if it exists, and otherwise renders a clean procedural placeholder (correct size, correct material: stone, oak, brass, glass, fabric). Use a single file /components/showroom/assets.ts listing every model path so real assets can be swapped in later.
3. Lighting driven by useDayPhase(): morning, afternoon, evening and night presets controlling sun direction and colour, window light, lamp intensity, environment map and exposure, exactly as described in the time-of-day table in CLAUDE.md. Blend between presets over 60 seconds. Use drei's Environment with HDRI files at /public/hdri/{morning,afternoon,evening,night}.hdr, falling back to a built-in preset if a file is missing.
4. Realism: physically based materials, soft shadows, subtle ambient occlusion and bloom only on lamps and gold. Keep effects adaptive: detect device performance with drei's PerformanceMonitor and lower quality on weak devices.
5. Navigation: a slow cinematic camera glide on first load (once, skipped if reduced motion), then the visitor moves between fixed viewpoints (Entrance, Shirts, Trousers, Mirror, Trial room) by tapping hotspots or on-screen arrows. No free-flying camera on mobile.
6. A "Shop in 2D" button always visible, linking to /collection.

Done when: the showroom renders with placeholders, changing the system clock (or a hidden ?phase=night URL override for testing) changes the lighting, hotspots move the camera, the 2D button works, and build and lint pass. Report the gzipped JS size.
Stop and ask before adding any dependency not listed above.
```

### Prompt 3 — The living NN logo

```
Read CLAUDE.md. Build only the animated NN logo.

Do:
1. Create /components/brand/LiveLogo.tsx: the NN monogram (two interlocked serif Ns inside a thin gold ring) as a 3D object in React Three Fiber, made from extruded shapes, in brushed NN Gold metal.
2. Idle animation: light slowly travels across the metal surface as if a showroom spotlight is moving; the ring rotates very slowly. On hover or tap, the two Ns separate slightly and settle back.
3. Use it in two places: large on the backlit wall sign in the showroom (lit according to useDayPhase: glowing at night, matte in daylight), and small in the header as a 2D SVG version that plays a short shimmer when the page loads.
4. With reduced motion on, show the static version only.

Done when: both versions render, the header version adds under 10 KB, and build and lint pass.
```

### Prompt 4 — Products, garments and Shopify

```
Read CLAUDE.md. Connect the product catalogue.

Allowed new dependency: none unless required for Shopify Storefront GraphQL; ask first if one is needed.

Do:
1. Create /lib/shopify.ts using the Storefront API (server-side fetch, values from .env.local). Functions: getProducts, getProduct(handle), createCart, addToCart, updateCart, getCart.
2. Each Shopify product has a metafield `nn.model_glb` (path to the garment .glb) and `nn.fit_notes`. Read them.
3. In the showroom, place products on the rails, table and mannequins from Shopify data, not hardcoded. Each garment loads its .glb or a placeholder shirt/trouser shape in the product's colour. Tapping a garment opens a product panel: name, colour, price, sizes, fabric, "Try it on", "Add to bag". The back-neck NN label must be visible when the garment is turned around.
4. Build /collection (2D grid) and /product/[handle] from the same data.
5. Bag drawer using the Shopify cart, saved by cart ID.

Done when: with test products in a Shopify development store, the showroom, collection page and product page all show the same live data and the bag works. If Shopify keys are missing, show a clear message on the page explaining which env variable to set.
Stop and ask before creating anything inside Shopify itself.
```

### Prompt 5 — Checkout with Razorpay

```
Read CLAUDE.md. Build checkout only.

Do:
1. Checkout page: contact, address (Indian address format, PIN code validation), delivery estimate, order summary.
2. Server route that creates a Razorpay order for the cart total. Client opens Razorpay Checkout. A server route verifies the payment signature before marking the order paid.
3. After verified payment, create the order in Shopify through the Admin API route and show a confirmation page.
4. Test mode only. Handle failure and cancelled payments with a clear message and the bag kept intact.

Done when: a full test payment works end to end in Razorpay test mode and a failed payment leaves the bag unchanged.
Stop and ask before switching anything to live mode.
```

### Prompt 6 — AI stylist

```
Read CLAUDE.md. Build the AI stylist.

Do:
1. Server route /api/stylist that calls the Claude API with ANTHROPIC_API_KEY from .env.local. Stream the reply to the browser.
2. System prompt for the stylist: NN voice (calm, precise, warm, no hype, no emojis). It may recommend ONLY products returned by getProducts() for this request, passed in as context. It must never invent products, prices, discounts or delivery promises. It answers occasion, pairing, fabric care and size questions, and suggests the trial room for fit.
3. Return structured output: reply text plus up to 3 product handles. Render them as tappable product cards.
4. The stylist is available as a chat panel from any page and as a concierge figure at the showroom counter.
5. Rate-limit per visitor and cap reply length to control cost.

Done when: the stylist answers with real products from Shopify, product cards open the right product, and the API key never appears in browser network responses.
```

### Prompt 7 — Trial room (version 1)

```
Read CLAUDE.md. Build trial room version 1 only. No photo upload, no camera.

Do:
1. /trial-room scene: an enclosed European fitting room with a curtain, a three-way mirror, a bench, soft warm light, NN brass hooks.
2. The visitor enters height, weight, usual jeans waist and fit preference. Scale a neutral 3D body (placeholder until a real body model is provided at /public/models/body.glb) to those measurements.
3. Show the selected garment on the body. Use the product's size chart from Shopify metafield `nn.size_chart` to compute ease at chest, waist and hip, and display a plain fit note per area (close, regular, easy) plus a recommended size.
4. "Add this size to bag" button.
5. Measurements stay on the visitor's device unless they choose to save them.

Done when: changing measurements changes the body and the recommended size, and add to bag uses the recommended size.
```

### Prompt 8 — Owner console with AI

```
Read CLAUDE.md. Build the owner console at /owner.

Do:
1. Owner login with Supabase Auth (email magic link). Only emails in an OWNER_EMAILS env list can enter.
2. Dashboard cards from Shopify and Supabase data: revenue, orders, average order value, conversion rate, return and RTO rate, best and weakest products, sell-through, stock alerts.
3. Showroom controls: preview any time-of-day phase, choose which products sit on the rails, table and mannequins, and set a featured product. Save to Supabase; the live showroom reads these settings.
4. NN Command Centre: an AI panel (Claude API, server-side) that answers questions about the business using only the dashboard data it is given, gives a daily summary, and flags unusual changes. It must say when data is missing instead of guessing.
5. Consent-based visitor analytics (after the DPDP consent banner): page views, showroom hotspots used, products viewed, trial room uses, stylist questions.

Done when: a non-owner email is refused, the dashboard shows live test data, showroom changes appear on the live site, and the AI summary cites the numbers it used.
Stop and ask before creating any database table.
```

### Prompt 9 — Polish, performance and launch check

```
Read CLAUDE.md. Do a quality pass only. Do not add features.

Check and fix:
1. Lighthouse mobile on the home page: performance 70+, accessibility 95+, SEO 95+. Report scores before and after.
2. First showroom view interactive under 4 s on a throttled "Fast 4G, mid-tier mobile" profile.
3. Every page works with 3D disabled and with reduced motion on.
4. Keyboard navigation and screen-reader labels on hotspots, product panels, bag and checkout.
5. SEO: metadata, Open Graph images, product structured data, sitemap.
6. Security: no secrets in client bundles, payment signature verified server-side, owner routes protected.

Done when: all checks pass with evidence. Stop and ask before any deployment.
```

---

## Part 5 — Asset briefs (for artists or 3D AI tools)

**Showroom brief for a Blender artist:**
European elite menswear boutique, approx. 12 m × 8 m, 4.5 m ceiling. Honed travertine floor with a brass-inlaid NN monogram at the entrance. Walls in warm limestone plaster. Tall arched steel-framed windows along one wall. Walnut service counter with a backlit NN wall sign behind it. Two long brushed-brass garment rails, a low oak table, two matte-black mannequins, a full-length antique-bronze mirror, a doorway to a fitting room with an ivory linen curtain. Separate objects, real-world scale in metres, PBR materials, baked AO, delivered as Draco-compressed .glb under 15 MB total with KTX2 textures.

**Prop prompt for Rodin / Meshy (one per prop):**
`realistic brushed brass garment rail, European luxury boutique fixture, 1.8 m long, slim round tube with wall brackets, PBR metal material, fine brushed texture, no background, no base, no floating parts, export GLB for web`

**Garment brief for a CLO 3D designer:**
Build each Collection 001 piece from the NN tech pack. Real fabric physical properties (Oxford cotton, poplin, trouser twill). Include the woven NN back-neck label, NN engraved buttons and the hangtag. Deliver each garment in three states: on hanger, folded, and on a size-M avatar. Export .glb with 2K textures, under 3 MB each.

---

## Part 6 — Order of work

1. Paste Prompt 0, then Prompt 1. Check it in the browser.
2. Prompts 2 and 3 give you the showroom and living logo with placeholders. This is the moment to start commissioning the real showroom and garment assets in parallel.
3. Prompts 4 and 5 make it a real store once Shopify and Razorpay test accounts are ready.
4. Prompts 6, 7 and 8 add the AI stylist, trial room and owner console.
5. Prompt 9 before launch. Real assets are swapped in by dropping files into /public/models and /public/hdri.
