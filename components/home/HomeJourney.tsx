"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from "framer-motion";
import { ShowroomStage } from "@/components/showroom/ShowroomStage";
import { GlassButton, GlassPill } from "@/components/ui/glass/Glass";
import { Reveal, RevealLines } from "@/components/motion/Reveal";
import { LiveMonogram } from "@/components/brand/Monogram";
import { useShowroom } from "@/components/layout/ShowroomProvider";
import { formatMoney } from "@/lib/bag";
import { TAGLINE, VIEWPOINTS } from "@/lib/tokens";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* The journey: one scroll, one continuous walk through the building   */
/* ------------------------------------------------------------------ */

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

interface ActDef {
  eyebrow: string;
  heading: string[];
  body: string;
  cta?: { href: string; label: string };
  secondary?: { href: string; label: string };
}

const ACTS: ActDef[] = [
  {
    eyebrow: "Nero Noren",
    heading: ["Timeless style", "builds character"],
    body: "An online-first house for men and boys. Everything here is one room — walk through it.",
    cta: { href: "/collection", label: "Enter the collection" },
    secondary: { href: "/trial-room", label: "Find your size" },
  },
  {
    eyebrow: "The hall",
    heading: ["Limestone,", "brass, light"],
    body: "Honed travertine underfoot, the monogram set into the floor at the threshold, and tall windows down one wall. The light in this room is the light where you are standing.",
  },
  {
    eyebrow: "Collection 001",
    heading: ["The Foundations"],
    body: "Shirting on brass, a hand apart. Trousers folded on oak so the line of the leg stays visible. Nothing here is styled to look like more than it is.",
    cta: { href: "/collection", label: "See every piece" },
  },
  {
    eyebrow: "Cloth",
    heading: ["Cotton oxford,", "poplin, twill"],
    body: "Oxford softens with wear and holds a collar roll. Poplin stays cool and takes a crease. The twill has enough weight to fall without clinging. That is the whole collection.",
  },
  {
    eyebrow: "The counter",
    heading: ["Someone", "is here"],
    body: "The house stylist knows Collection 001 and nothing else, which is exactly why the advice is useful.",
    cta: { href: "/stylist", label: "Ask the stylist" },
  },
  {
    eyebrow: "The fitting room",
    heading: ["Your", "measurements"],
    body: "Height, weight and the trouser waist you already wear, read against the real size chart. It names the size and says where the garment will sit close and where it will be easy.",
    cta: { href: "/trial-room", label: "Enter the trial room" },
  },
];

function Act({
  act,
  index,
  total,
  progress,
}: {
  act: ActDef;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const span = 1 / total;
  const start = index * span;
  const first = index === 0;
  const last = index === total - 1;
  // The entrance carries the page's only h1; the rest of the walk is h2.
  const Heading = first ? "h1" : "h2";

  // Scroll-linked ranges must stay inside [0, 1] and never decrease:
  // the browser runs these on a scroll timeline, which rejects anything else.
  // The first act opens already lit; the last one stays lit to the end.
  const stops: [number, number, number, number] = [
    first ? 0 : clamp01(start - span * 0.42),
    first ? 0 : clamp01(start + span * 0.12),
    last ? 1 : clamp01(start + span * 0.74),
    last ? 1 : clamp01(start + span * 1.1),
  ];

  const opacity = useTransform(progress, stops, [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(progress, [stops[0], stops[3]], [first ? 0 : 46, last ? 0 : -46]);
  // A finished act is taken out of the compositor entirely. Six stacked
  // full-screen layers above a WebGL canvas otherwise leave ghosts behind.
  const visibility = useTransform(opacity, (o) => (o < 0.015 ? "hidden" : "visible"));

  return (
    <motion.div
      style={{ opacity, y, visibility }}
      className="pointer-events-none absolute inset-0 z-20 flex items-center px-5 sm:px-8"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[84rem]">
        <div className="max-w-xl">
          <GlassPill>
            <span className="h-1 w-1 rounded-full bg-accent" />
            {act.eyebrow}
          </GlassPill>

          <Heading className="nn-display mt-6 text-[clamp(2.6rem,8.5vw,5.8rem)] text-ink">
            <RevealLines lines={act.heading} />
          </Heading>

          <p className="nn-body mt-6 text-[0.95rem] text-ink-soft sm:text-base">{act.body}</p>

          {act.cta && (
            <div className="mt-9 flex flex-wrap gap-3">
              <GlassButton href={act.cta.href} variant="solid" size="lg">
                {act.cta.label}
              </GlassButton>
              {act.secondary && (
                <GlassButton href={act.secondary.href} variant="glass" size="lg">
                  {act.secondary.label}
                </GlassButton>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProgressRail({ progress }: { progress: MotionValue<number> }) {
  const scaleY = useTransform(progress, [0, 1], [0.04, 1]);
  return (
    <div className="pointer-events-none absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
      <div className="relative h-40 w-px bg-line">
        <motion.div style={{ scaleY }} className="absolute inset-0 origin-top bg-accent" />
      </div>
      <span className="nn-meta text-ink-faint [writing-mode:vertical-rl]">The showroom</span>
    </div>
  );
}

export function HomeJourney({
  products,
  configured,
}: {
  products: Product[];
  configured: boolean;
}) {
  const scrollHost = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const { reducedMotion } = useShowroom();

  const { scrollYProgress } = useScroll({
    target: scrollHost,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
  });

  const hero = products[0];

  return (
    <>
      {/* ---------- the walk ---------- */}
      <div ref={scrollHost} className="relative" style={{ height: `${ACTS.length * 100}vh` }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <ShowroomStage
            products={products}
            mode="scroll"
            scrollRef={progressRef}
            intro
            className="z-0"
          />

          {/* a scrim so type stays legible over the room at every hour */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "linear-gradient(100deg, color-mix(in srgb, var(--bg) 80%, transparent) 0%, color-mix(in srgb, var(--bg) 32%, transparent) 46%, transparent 72%)",
            }}
          />

          {ACTS.map((act, i) => (
            <Act
              key={act.eyebrow}
              act={act}
              index={i}
              total={ACTS.length}
              progress={scrollYProgress}
            />
          ))}

          <ProgressRail progress={scrollYProgress} />

          {!reducedMotion && (
            <motion.div
              className="pointer-events-none absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2.5 md:bottom-9"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4.5, times: [0, 0.2, 0.7, 1], delay: 2.4 }}
            >
              <span className="nn-meta text-ink-faint">Scroll to walk through</span>
              <span className="h-9 w-px bg-gradient-to-b from-accent to-transparent" />
            </motion.div>
          )}
        </div>
      </div>

      {/* ---------- the pieces ---------- */}
      <section className="relative z-10 border-t border-line bg-bg/85 px-5 py-24 backdrop-blur-md sm:px-8 md:py-32">
        <div className="mx-auto max-w-[84rem]">
          <Reveal>
            <p className="nn-meta text-ink-faint">Collection 001</p>
            <h2 className="nn-display mt-4 text-[clamp(2.2rem,6vw,4rem)] text-ink">
              The Foundations
            </h2>
            <p className="nn-body mt-5 text-ink-soft">
              Five shapes, made to be worn together. The shirt the wardrobe is built around, the
              trouser that goes with all of it.
            </p>
          </Reveal>

          <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 8).map((p, i) => (
              <Reveal key={p.id} as="li" delay={i * 0.05} className="bg-bg">
                <Link
                  href={`/product/${p.handle}`}
                  className="group flex h-full flex-col p-6 transition-colors duration-500 hover:bg-bg-elev"
                >
                  <div
                    className="relative aspect-3/4 w-full overflow-hidden"
                    style={{
                      background: p.images[0]
                        ? `center/cover no-repeat url(${p.images[0].url})`
                        : `linear-gradient(170deg, ${p.swatch}, color-mix(in srgb, ${p.swatch} 62%, #000))`,
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-t from-nnblack/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="mt-5 flex flex-1 flex-col">
                    <h3 className="font-display text-2xl font-light leading-tight text-ink">
                      {p.title}
                    </h3>
                    <p className="nn-meta mt-1.5 text-ink-faint">{p.colour}</p>
                    <p className="nn-body mt-3 line-clamp-2 flex-1 text-[0.8rem] text-ink-soft">
                      {p.fabric}
                    </p>
                    <p className="nn-label mt-4 text-ink">
                      {formatMoney(p.price) ?? <span className="text-ink-faint">Price in store</span>}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>

          {!configured && (
            <Reveal delay={0.1}>
              <p className="nn-meta mt-8 max-w-2xl leading-relaxed text-ink-faint">
                These are the pieces of Collection 001 as they are displayed in the showroom.
                Prices, sizes in stock and photography are held in the store and appear here the
                moment it is connected — nothing on this page is invented.
              </p>
            </Reveal>
          )}

          <Reveal delay={0.15}>
            <div className="mt-12">
              <GlassButton href="/collection" variant="solid" size="lg">
                Every piece
              </GlassButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- the house ---------- */}
      <section className="relative z-10 border-t border-line px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto grid max-w-[84rem] gap-16 md:grid-cols-[0.9fr_1.1fr] md:gap-24">
          <Reveal>
            <LiveMonogram className="h-12 w-auto text-accent" />
            <h2 className="nn-display mt-8 text-[clamp(2.2rem,5.5vw,3.6rem)] text-ink">
              {TAGLINE}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-6">
            <p className="nn-body text-ink-soft">
              Nero Noren begins online and is built to last longer than that. The pieces are chosen
              so that a man and a boy can be dressed from the same collection, in the same cloth,
              cut to the same standard.
            </p>
            <p className="nn-body text-ink-soft">
              The showroom you have just walked through is drawn entirely in code — the stone, the
              brass, the light through the windows, the hour of the day. It exists so that a
              garment can be presented the way a garment is presented in a room, rather than as a
              tile in a grid.
            </p>
            <GlassButton href="/about" variant="quiet">
              Read the house
            </GlassButton>
          </Reveal>
        </div>
      </section>

      {/* ---------- fitting and stylist ---------- */}
      <section className="relative z-10 grid border-t border-line md:grid-cols-2">
        {[
          {
            eyebrow: "Trial room",
            title: "Know the size before it arrives",
            body: "Three measurements, read against the real size chart. The result names the size and says where it will sit close and where it will be easy.",
            href: "/trial-room",
            cta: "Enter the trial room",
          },
          {
            eyebrow: "Stylist",
            title: "Ask someone who knows the cloth",
            body: "The house stylist answers on occasion, pairing, fabric and fit — and only ever points at pieces that exist.",
            href: "/stylist",
            cta: "Ask the stylist",
          },
        ].map((c, i) => (
          <Reveal
            key={c.href}
            delay={i * 0.08}
            className={`px-5 py-20 sm:px-8 md:py-28 ${i === 0 ? "md:border-r md:border-line" : ""}`}
          >
            <div className="mx-auto max-w-lg">
              <p className="nn-meta text-ink-faint">{c.eyebrow}</p>
              <h2 className="nn-display mt-4 text-[clamp(1.9rem,4.5vw,2.9rem)] text-ink">
                {c.title}
              </h2>
              <p className="nn-body mt-5 text-ink-soft">{c.body}</p>
              <GlassButton href={c.href} variant="glass" className="mt-8">
                {c.cta}
              </GlassButton>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ---------- the way out ---------- */}
      <section className="relative z-10 border-t border-line px-5 py-28 text-center sm:px-8 md:py-40">
        <Reveal>
          <p className="nn-meta text-ink-faint">{VIEWPOINTS[0].caption}</p>
          <h2 className="nn-display mx-auto mt-6 max-w-3xl text-[clamp(2.4rem,7vw,5rem)] text-ink">
            {hero ? `Begin with ${hero.title}` : "Begin with Collection 001"}
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <GlassButton href="/collection" variant="solid" size="lg">
              Collection 001
            </GlassButton>
            <GlassButton href="/sizing" variant="quiet" size="lg">
              Sizing
            </GlassButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
