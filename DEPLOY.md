# Going live

Work through this in order. Each step makes one more part of the site real, and
the site keeps working after every step — you can stop and come back.

Nothing here needs code changes. It is accounts, keys and settings.

> **Never paste a key into a chat, a commit, or this file.** Keys go in
> `.env.local` on your machine, and into Vercel's own settings for the live
> site. `.env.local` is already git-ignored.

---

## 0. Before anything

Copy the blank slots into a real file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in each value as you obtain it below.

---

## 1. Put it on the internet — Vercel

1. Create a free account at vercel.com and connect your GitHub.
2. Import `NaseemudheenT/NN`. Vercel detects Next.js on its own; accept the
   defaults.
3. Deploy. You will get a URL like `nn-xxxx.vercel.app`.
4. In **Settings → Environment Variables**, add every variable from
   `.env.example` that you have filled in. Add them for Production, Preview and
   Development.
5. Set `NEXT_PUBLIC_SITE_URL` to your real URL.

The site is now live on the reference catalogue. Everything works; prices are
not yet yours.

### Your own address

In Vercel, **Settings → Domains**, add `neronoren.com` and follow the DNS
instructions your registrar needs. Update `NEXT_PUBLIC_SITE_URL` afterwards.

---

## 2. Real products — Shopify

1. Create a Shopify development store.
2. **Settings → Apps and sales channels → Develop apps → Create an app.**
3. Under **Configuration → Storefront API**, enable at least:
   `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`,
   `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`.
4. Install the app, then copy the **Storefront API access token**.
5. Put these in `.env.local` and in Vercel:

   ```
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_TOKEN=the token you copied
   ```

6. Add your eight products. Title them **`The Oxford, Bianco`** — the part before
   the comma is the name, the part after is the colour. Give each a `Size`
   option with your sizes.

### The metafields NN reads

**Settings → Custom data → Products → Add definition.** Namespace `nn` for all
of them.

| Key | Type | What it is |
|---|---|---|
| `colour_hex` | Single line text | The cloth colour, e.g. `#F4F2ED`. Drives the 2D drawing and the 3D placeholder |
| `stripe_hex` | Single line text | Woven stripe colour, for striped cloth only |
| `fabric` | Multi-line text | The fabric description |
| `care` | Multi-line text | Washing and pressing |
| `best_for` | Single line text | "Office days and evenings out" |
| `fit_notes` | Multi-line text | How the piece actually wears |
| `size_chart` | JSON | The size chart. Omit it and the default for that garment type is used |
| `placement` | Single line text | Where it stands in the showroom: `rail-a`, `rail-b`, `table`, `mannequin-1`, `mannequin-2` |
| `model_glb` | Single line text | Path to the garment's `.glb`, e.g. `/models/garments/oxford-bianco-hanger.glb` |

The moment the two Shopify variables are set, the reference-catalogue notice
disappears and every price on the site comes from Shopify.

### The Admin token — needed for orders and the dashboard

In the same app, under **Configuration → Admin API**, enable `write_orders`,
`read_orders` and `read_products`. Copy the **Admin API access token** into
`SHOPIFY_ADMIN_TOKEN`.

Without it the shop still sells, but no order record is written after payment
and the owner console cannot show revenue.

---

## 3. Real payments — Razorpay

1. Create a Razorpay account. **Stay in Test mode.**
2. **Settings → API Keys → Generate Test Key.**
3. Add both to `.env.local` and Vercel:

   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=the secret
   ```

4. Test a payment end to end with Razorpay's published test card numbers. Check
   that a **cancelled** payment leaves your bag untouched, and that a successful
   one reaches the confirmation page with a payment reference.

Only switch to live keys once you have completed a full test order, and decide
that deliberately — the site does not care which it is given, so the choice is
entirely yours.

---

## 4. The stylist and the command centre — Claude

1. Create an account at console.anthropic.com and add credit.
2. Create an API key.
3. `ANTHROPIC_API_KEY=sk-ant-...`

The stylist answers from the style guide without it, so this is an upgrade, not
a dependency. The key is read on the server only and never reaches a browser.

---

## 5. Your login and your numbers — Supabase

1. Create a free project at supabase.com.
2. **Project Settings → API**: copy the Project URL, the `anon` key and the
   `service_role` key.

   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...      # server only, never in a browser
   OWNER_EMAILS=you@example.com       # comma-separated
   ```

3. **Authentication → Providers → Email**: enable it, and turn **off** "Allow new
   users to sign up". The owner console only ever signs in an existing user.
4. **Authentication → Users → Add user** for each address in `OWNER_EMAILS`.
5. **Authentication → URL Configuration**: add `https://your-domain/owner` to the
   redirect allow-list.
6. Open the **SQL Editor** and run this once. The application never creates or
   alters a table:

   ```sql
   -- consented analytics
   create table nn_events (
     id         bigint generated always as identity primary key,
     name       text        not null,
     detail     jsonb       not null default '{}',
     hour       text        not null,
     created_at timestamptz not null default now()
   );
   create index nn_events_hour_idx on nn_events (hour);
   alter table nn_events enable row level security;
   -- no policy: only the service role, on the server, may read or write

   -- showroom settings
   create table nn_showroom_settings (
     id              text primary key default 'live',
     featured_handle text,
     forced_phase    text,
     placements      jsonb       not null default '{}',
     updated_at      timestamptz not null default now()
   );
   insert into nn_showroom_settings (id) values ('live');
   alter table nn_showroom_settings enable row level security;
   ```

Now open `/owner`, enter an address from `OWNER_EMAILS`, and follow the link in
your email. Any other address is refused.

---

## 6. The real showroom — 3D assets

The site is complete without these; they are what make it photoreal.

1. **The room.** Commission a Blender artist from the brief in
   `public/models/README.md`. Real-world scale in metres, Draco-compressed
   `.glb`, KTX2 textures, under 15 MB for the lot, delivered as separate objects.
2. **The garments.** A CLO 3D designer builds each piece from your tech packs
   with real fabric physics, including the woven back-neck label, the engraved
   buttons and the hangtag. Three states each — on a hanger, folded, on a size-M
   avatar. Under 3 MB each.
3. **The light.** Free HDRIs from polyhaven.com to start: save them as
   `/public/hdri/morning.hdr`, `afternoon.hdr`, `evening.hdr`, `night.hdr`.

Then:

```bash
npm run models:manifest
```

Commit, push, and the showroom uses them. No code changes.

---

## 7. Before you announce it

- [ ] A full test payment completes, and a cancelled one leaves the bag intact
- [ ] Every product page shows your prices and your stock from Shopify
- [ ] The trial room recommends a size you agree with for someone you know
- [ ] The stylist recommends only pieces you actually make
- [ ] `/owner` refuses an address that is not on the list
- [ ] The consent banner appears, and declining stops all counting
- [ ] The site works with 3D turned off
- [ ] Lighthouse mobile on the home page: performance 70+, accessibility 95+, SEO 95+
- [ ] `NEXT_PUBLIC_SITE_URL` is your real domain, so sitemap and share cards are right
- [ ] Razorpay switched to live keys — deliberately, and last

---

## If something breaks

Every part of this site fails loudly and in plain language rather than silently.
If a page says a variable is missing, that is the actual problem — set it.

- **"Reference catalogue" notice won't go away** — `SHOPIFY_STORE_DOMAIN` or
  `SHOPIFY_STOREFRONT_TOKEN` is wrong, or the store has no products yet. The
  notice says which.
- **Payment button disabled** — Razorpay keys are not set.
- **Owner console refuses you** — your address is not in `OWNER_EMAILS`, or you
  have not been added as a Supabase user.
- **Dashboard figures say "not available"** — that is honest, not broken. It
  names what is missing. Usually `SHOPIFY_ADMIN_TOKEN`, or the `nn_events` table.
- **Showroom is placeholders** — no `.glb` files yet, or `manifest.json` is stale.
  Run `npm run models:manifest`.
